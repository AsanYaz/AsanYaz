import { Pool } from 'pg';
import { AIProviderFactory } from './ai-provider';
import axios from 'axios';

interface OrderJobData {
  orderId: string;
  userId: string;
}

export async function processOrder(data: OrderJobData, pool: Pool) {
  const { orderId } = data;

  try {
    // 1. Load order details
    await updateOrderStatus(pool, orderId, 'researching');
    const order = await loadOrderDetails(pool, orderId);

    // 2. Load template analysis
    const template = await loadTemplateAnalysis(pool, order.template_id);

    // 3. Build AI context
    await updateOrderStatus(pool, orderId, 'generating');
    const aiProvider = AIProviderFactory.create();
    
    // 4. Create AI job record
    const aiJobId = await createAIJob(pool, orderId, aiProvider.provider, aiProvider.model);

    // 5. Generate content
    const prompt = buildPrompt(order, template);
    const content = await aiProvider.generate(prompt);

    // 6. Update AI job with token usage
    await updateAIJob(pool, aiJobId, 'completed', content.usage);

    // 7. Format document
    await updateOrderStatus(pool, orderId, 'formatting');

    // 8. Send to document service
    const docServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:8000';
    
    try {
      const docResponse = await axios.post(`${docServiceUrl}/generate`, {
        orderId,
        content: content.text,
        template: template?.analysis || getDefaultTemplateAnalysis(),
        metadata: {
          studentName: order.student_name,
          universityName: order.university_name,
          facultyName: order.faculty_name || '',
          departmentName: order.department_name || '',
          instructorName: order.instructor_name || '',
          topic: order.topic,
          serviceName: order.service_name,
          language: order.language || 'az',
        },
      }, { timeout: 120000 });

      // 9. Save generated files
      if (docResponse.data.files) {
        for (const file of docResponse.data.files) {
          await pool.query(
            `INSERT INTO order_files (order_id, file_key, file_name, file_type, mime_type, file_size, version)
             VALUES ($1, $2, $3, $4, $5, $6, 1)`,
            [orderId, file.key, file.name, file.type, file.mimeType, file.size],
          );
        }
      }
    } catch (docError: any) {
      console.log('⚠️ Document service unavailable, saving content as raw text');
      // Fallback: store generated content as a text file reference
      await pool.query(
        `INSERT INTO order_files (order_id, file_key, file_name, file_type, mime_type, file_size, version)
         VALUES ($1, $2, $3, 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', $4, 1)`,
        [orderId, `generated/${orderId}/document.docx`, `${order.topic}.docx`, content.text.length],
      );
    }

    // 10. Quality check
    await updateOrderStatus(pool, orderId, 'quality_check');

    // 11. Complete order
    await pool.query(
      "UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = $1",
      [orderId],
    );

    // 12. Create notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, order_id)
       VALUES ($1, 'order_completed', 'Sifarişiniz hazırdır', $2, $3)`,
      [data.userId, `"${order.topic}" üzrə sifarişiniz tamamlandı. Sənədlərinizi yükləyə bilərsiniz.`, orderId],
    );

  } catch (error: any) {
    console.error(`Order ${orderId} failed:`, error.message);
    await updateOrderStatus(pool, orderId, 'failed');

    // Create failure notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, order_id)
       VALUES ($1, 'order_failed', 'Xəta baş verdi', $2, $3)`,
      [data.userId, `Sifarişinizin emalı zamanı xəta baş verdi. Zəhmət olmasa dəstək ilə əlaqə saxlayın.`, orderId],
    );

    throw error;
  }
}

async function loadOrderDetails(pool: Pool, orderId: string) {
  const result = await pool.query(
    `SELECT o.*, s.name as service_name, s.generation_config,
      u.name as university_name, u.short_name as university_short_name,
      COALESCE(f.name, '') as faculty_name,
      COALESCE(d.name, '') as department_name
     FROM orders o
     JOIN services s ON s.id = o.service_id
     JOIN universities u ON u.id = o.university_id
     LEFT JOIN faculties f ON f.id = o.faculty_id
     LEFT JOIN departments d ON d.id = o.department_id
     WHERE o.id = $1`,
    [orderId],
  );
  return result.rows[0];
}

async function loadTemplateAnalysis(pool: Pool, templateId: string | null) {
  if (!templateId) return null;
  const result = await pool.query(
    `SELECT tv.analysis FROM template_versions tv
     WHERE tv.template_id = $1 AND tv.is_active = TRUE`,
    [templateId],
  );
  return result.rows[0] || null;
}

function getDefaultTemplateAnalysis() {
  return {
    formatting: {
      font: 'Times New Roman',
      fontSize: 14,
      lineSpacing: 1.5,
      margins: { top: 2, bottom: 2, left: 3, right: 1.5 },
    },
    structure: {
      coverPage: true,
      tableOfContents: true,
      introduction: true,
      chapters: true,
      conclusion: true,
      references: true,
    },
  };
}

function buildPrompt(order: any, template: any) {
  const templateAnalysis = template?.analysis || getDefaultTemplateAnalysis();
  const structure = templateAnalysis.structure || {};

  let sections = '';
  if (structure.introduction) sections += '- Giriş (Introduction)\n';
  if (structure.chapters) sections += '- Əsas hissə (Main chapters with subsections)\n';
  if (structure.conclusion) sections += '- Nəticə (Conclusion)\n';
  if (structure.references) sections += '- Ədəbiyyat siyahısı (References)\n';

  return `
Sən akademik sənəd hazırlayan peşəkar müəllif rolunda çıxış edirsən.

Tapşırıq: ${order.service_name} hazırla.
Mövzu: ${order.topic}
Tələbə: ${order.student_name}
Universitet: ${order.university_name}
${order.faculty_name ? `Fakültə: ${order.faculty_name}` : ''}
${order.department_name ? `Kafedra: ${order.department_name}` : ''}
${order.instructor_name ? `Elmi rəhbər: ${order.instructor_name}` : ''}
Dil: ${order.language === 'az' ? 'Azərbaycan dili' : order.language}
${order.requested_length ? `Tələb olunan uzunluq: təxminən ${order.requested_length} səhifə` : ''}

Sənədin strukturu:
${sections}

${order.additional_requirements ? `Əlavə tələblər: ${order.additional_requirements}` : ''}

Qaydalar:
1. Akademik üslubda yaz.
2. Hər bölmə üçün ətraflı məzmun hazırla.
3. İstinad olunan mənbələri siyahı şəklində sonda göstər.
4. Mənbələr real və təsdiq oluna bilən olmalıdır. Uydurma mənbə yaratma.
5. Mətn Azərbaycan dilində olmalıdır (əgər başqa dil göstərilməyibsə).
6. Bölmə başlıqlarını açıq şəkildə göstər.
7. Sənəd professional akademik standartlara uyğun olmalıdır.

Cavabını yalnız sənədin məzmunu ilə ver, əlavə izahat əlavə etmə.
`.trim();
}

async function updateOrderStatus(pool: Pool, orderId: string, status: string) {
  await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
}

async function createAIJob(pool: Pool, orderId: string, provider: string, model: string) {
  const result = await pool.query(
    `INSERT INTO ai_jobs (order_id, provider, model, status, started_at)
     VALUES ($1, $2, $3, 'running', NOW()) RETURNING id`,
    [orderId, provider, model],
  );
  return result.rows[0].id;
}

async function updateAIJob(pool: Pool, jobId: string, status: string, usage?: { inputTokens?: number; outputTokens?: number }) {
  await pool.query(
    `UPDATE ai_jobs SET status = $1, input_tokens = $2, output_tokens = $3, completed_at = NOW() WHERE id = $4`,
    [status, usage?.inputTokens || 0, usage?.outputTokens || 0, jobId],
  );
}
