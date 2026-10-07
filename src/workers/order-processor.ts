import { Job } from 'bullmq';
import { prisma } from '../lib/db';
import { 
  getQueue, 
  QUEUE_NAMES, 
  enqueueTemplateAnalysis, 
  enqueueDocumentGeneration,
  OrderProcessingJobData
} from '../lib/queue';
import { PromptBuilder, PromptContext } from '../lib/ai/prompt-builder';

export async function processOrderJob(job: Job<OrderProcessingJobData>) {
  const { orderId, attempt } = job.data;
  console.log(`Processing order ${orderId} (attempt ${attempt})`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      user: true,
      template: {
        include: { analysis: true }
      },
      university: true,
      faculty: true,
      department: true,
      files: true,
      inputs: true,
    }
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Update order status to queued/processing if it was paid
  if (order.status === 'paid') {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'queued' }
    });
  }

  // Initiate the workflow
  // 1. Gather all inputs
  const inputs = await prisma.orderInput.findMany({
    where: { orderId }
  });

  // 2. Add to Document Generation Queue (simplifying for now, normally AI happens here first)
  // Let's assume this worker prepares the AI prompt and then enqueues AI generation
  // For the sake of this file, we will directly enqueue Document Generation after AI is done.
  // We should have an AI job orchestrator here.
  
  // Let's mark as researching/generating
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'generating' }
  });

  // In a full flow: enqueue AI Research -> AI Outline -> AI Content -> Doc Gen
  // We will jump to Document Gen queue for now, simulating AI response, but wait, the prompt builder is ready.
  // We will do AI generation directly in the AI worker. This order processor just orchestrates.

  // Instead of full orchestration here, let's enqueue to the AI content generation.
  // But wait, the requirements say AI operates in the backend asynchronously.
  
  // Let's create an AI job record
  const aiJob = await prisma.aIJob.create({
    data: {
      orderId: order.id,
      jobType: 'content_generation',
      status: 'pending',
      provider: 'gemini',
      model: 'gemini-2.5-pro'
    }
  });

  // 3. Build the prompt context using real data
  const promptContext: PromptContext = {
    service: { name: order.service.name, slug: order.service.slug },
    topic: order.topic,
    customTitle: order.customTitle,
    student: { name: order.studentName || order.user.email || 'Tələbə' },
    university: { name: order.university.name, shortName: order.university.shortName },
    faculty: order.faculty ? { name: order.faculty.name } : null,
    department: order.department ? { name: order.department.name } : null,
    instructor: order.instructorName ? { name: order.instructorName, title: order.instructorTitle } : null,
    language: 'az', // Platform is AZ only
    requestedLength: order.requestedLength,
    additionalRequirements: order.additionalReqs,
    templateAnalysis: order.template?.analysis || null,
  };

  const builder = new PromptBuilder(promptContext);
  const systemPrompt = builder.buildSystemPrompt();
  const contentPrompt = builder.buildContentPrompt();

  const { getAIProvider } = await import('../lib/ai/provider');
  const aiProvider = getAIProvider();
  
  // Real AI generation using the constructed prompts
  const result = await aiProvider.generate({
    systemPrompt: systemPrompt,
    prompt: contentPrompt
  });

  // Update AI Job
  await prisma.aIJob.update({
    where: { id: aiJob.id },
    data: {
      status: 'completed',
      completionTokens: result.completionTokens,
      promptTokens: result.promptTokens,
      totalTokens: result.totalTokens,
      completedAt: new Date()
    }
  });

  // Enqueue Doc Generation
  await enqueueDocumentGeneration({
    orderId: order.id,
    content: result.content,
    templateId: order.templateId!,
    outputFormats: order.service.outputFormats
  });
}
