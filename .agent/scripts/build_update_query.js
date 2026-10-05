import fs from 'fs';

const demographic_qs = [
  {
    "id": "resp_ft",
    "text": "Anh/chị hiện có đang làm việc toàn thời gian không?",
    "textEN": "Are you currently working full-time?",
    "type": "radio",
    "options": ["Có", "Không"],
    "optionsEN": ["Yes", "No"],
    "required": true,
    "section": "Thông tin chung"
  },
  {
    "id": "resp_eval",
    "text": "Anh/chị đã từng trải qua ít nhất một kỳ đánh giá hiệu suất chính thức chưa?",
    "textEN": "Have you ever undergone at least one formal performance evaluation?",
    "type": "radio",
    "options": ["Có", "Không"],
    "optionsEN": ["Yes", "No"],
    "required": true,
    "section": "Thông tin chung"
  },
  {
    "id": "resp_ai_dev",
    "text": "Anh/chị có làm trực tiếp trong lĩnh vực phát triển AI, thiết kế hệ thống HR-tech hoặc phát triển thuật toán không?",
    "textEN": "Are you directly involved in AI development, HR-tech system design, or algorithm development?",
    "type": "radio",
    "options": ["Có", "Không"],
    "optionsEN": ["Yes", "No"],
    "required": true,
    "section": "Thông tin chung"
  },
  {
    "id": "resp_gender",
    "text": "Giới tính",
    "textEN": "Gender",
    "type": "radio",
    "options": ["Nam", "Nữ", "Khác", "Không muốn trả lời"],
    "optionsEN": ["Male", "Female", "Other", "Prefer not to say"],
    "required": true,
    "section": "Thông tin chung"
  },
  {
    "id": "resp_age",
    "text": "Độ tuổi",
    "textEN": "Age",
    "type": "radio",
    "options": ["18-24", "25-34", "35-44", "45-54", "Từ 55 trở lên"],
    "optionsEN": ["18-24", "25-34", "35-44", "45-54", "55 and above"],
    "required": true,
    "section": "Thông tin chung"
  },
  {
    "id": "resp_region",
    "text": "Khu vực làm việc",
    "textEN": "Work region",
    "type": "radio",
    "options": ["TP.HCM", "Hà Nội", "Miền Bắc khác", "Miền Trung - Tây Nguyên", "Miền Nam khác"],
    "optionsEN": ["HCMC", "Hanoi", "Other North", "Central - Highlands", "Other South"],
    "required": true,
    "section": "Thông tin chung"
  },
  {
    "id": "resp_dept",
    "text": "Phòng ban/chức năng",
    "textEN": "Department/Function",
    "type": "radio",
    "options": ["Kinh doanh", "Marketing-CSKH", "Vận hành-Sản xuất", "Tài chính-Kế toán", "Nhân sự-Hành chính", "IT-Kỹ thuật", "Khác"],
    "optionsEN": ["Sales", "Marketing - Customer Care", "Operations - Production", "Finance - Accounting", "HR - Admin", "IT - Technical", "Other"],
    "required": true,
    "section": "Thông tin chung"
  },
  {
    "id": "resp_experience",
    "text": "Số năm kinh nghiệm làm việc",
    "textEN": "Years of work experience",
    "type": "radio",
    "options": ["Dưới 1 năm", "1-3 năm", "4-6 năm", "7-10 năm", "Trên 10 năm"],
    "optionsEN": ["Under 1 year", "1-3 years", "4-6 years", "7-10 years", "Over 10 years"],
    "required": true,
    "section": "Thông tin chung"
  }
];

const control_qs = [
  {
    "id": "ATT1",
    "text": "Trong báo cáo trên, điểm đánh giá tổng hợp của NV-A là bao nhiêu?",
    "textEN": "In the above report, what is the composite evaluation score of Employee A?",
    "type": "text",
    "required": true,
    "section": "Biến kiểm soát"
  },
  {
    "id": "DETAIL_LEVEL",
    "text": "Theo Anh/chị, báo cáo trên cung cấp mức độ thông tin chi tiết như thế nào?",
    "textEN": "In your opinion, how detailed is the information provided in the above report?",
    "type": "likert",
    "scaleStart": 1,
    "scaleEnd": 7,
    "labelStart": "Rất sơ sài",
    "labelEnd": "Rất chi tiết",
    "labelStartEN": "Very sketchy",
    "labelEndEN": "Very detailed",
    "required": true,
    "section": "Biến kiểm soát"
  },
  {
    "id": "email",
    "text": "Nếu Anh/chị có nhu cầu nhận kết quả của nghiên cứu này, chúng tôi sẵn sàng cung cấp sau khi hoàn thành, vui lòng nhập địa chỉ email của Anh/chị hoặc gõ \"Không\" nếu Anh/chị không có nhu cầu.",
    "textEN": "If you wish to receive the results of this study, we will provide them upon completion. Please enter your email address or type \"No\" if you do not need it.",
    "type": "text",
    "required": true,
    "section": "Biến kiểm soát"
  }
];

const existing_qs = [
  {"id":"Q_1781329243505","text":"Tôi quan tâm đến cách người khác nhìn nhận tôi tại nơi làm việc","type":"likert","order":1,"textEN":"I care about how others perceive me at work","section":"Câu hỏi ban đầu","labelEnd":" ","required":true,"labelStart":" "},
  {"id":"Q_1781329358549","text":"<span style=\"font-size: 12px;\"><span style=\"font-size: 12pt;\">Tôi cảm thấy không thoải mái khi đồng nghiệp quan sát cách tôi được đánh giá tại nơi làm việc.</span></span>","type":"likert","order":2,"textEN":"<span style=\"font-size: 12px;\"><span style=\"font-size: 12pt;\">I feel uncomfortable when my colleagues observe how I am evaluated at work.</span></span>","section":"Câu hỏi ban đầu","labelEnd":" ","required":true,"labelStart":" "},
  {"id":"Q_1781329400894","text":"<span style=\"font-size: 12px;\"><span style=\"font-size: 12pt;\">Việc duy trì danh tiếng của tôi trước người khác là điều quan trọng.</span></span>","type":"likert","order":3,"textEN":"<span style=\"font-size: 12px;\"><span style=\"font-size: 12pt;\">Maintaining my reputation with others is important.</span></span>","section":"Câu hỏi ban đầu","labelEnd":" ","required":true,"labelStart":" "},
  {"id":"Q_1781329422689","text":"<span style=\"font-size: 12px;\"><span style=\"font-size: 12pt;\">Điều quan trọng đối với tôi là đồng nghiệp có ấn tượng tích cực về kết quả đánh giá hiệu suất làm việc của tôi</span></span>","type":"likert","order":4,"textEN":"<span style=\"font-size: 12px;\"><span style=\"font-size: 12pt;\">It is important to me that my colleagues have a positive impression of my performance appraisal</span></span>","section":"Câu hỏi ban đầu","labelEnd":" ","required":true,"labelStart":" "},
  {"id":"Q_1781329763369","text":"<span style=\"font-size: 16px;\">​Tôi lo ngại việc kết quả đánh giá hiệu suất làm việc sẽ ảnh hưởng như thế nào đến hình ảnh chuyên nghiệp của tôi trước mặt người khác.</span>","type":"likert","order":5,"textEN":"<span style=\"font-size: 16px;\">​I am concerned about how the results of my performance appraisal will affect my professional image to others.</span>","section":"Câu hỏi ban đầu","labelEnd":" ","required":true,"labelStart":" "},
  {"id":"RA1","text":"Tôi cảm thấy hệ thống AI là một tác nhân phù hợp để hỗ trợ nhiệm vụ đánh giá hiệu suất này.","type":"likert","order":6,"textEN":"I feel the AI system is an appropriate agent to support this performance evaluation task.","section":"Role Appropriateness"},
  {"id":"RA2","text":"Vai trò của AI trong quy trình đánh giá hiệu suất này là phù hợp.","type":"likert","order":7,"textEN":"The role of AI in this performance evaluation process is appropriate.","section":"Role Appropriateness"},
  {"id":"RA3","text":"Việc AI tham gia hỗ trợ đánh giá hiệu suất phù hợp với kỳ vọng của tôi về vai trò của công nghệ trong quyết định này.","type":"likert","order":8,"textEN":"AI participation in supporting performance evaluation aligns with my expectations of the role of technology in this decision.","section":"Role Appropriateness"},
  {"id":"PF1","text":"Tôi có cơ hội cung cấp ý kiến hoặc phản hồi liên quan đến quy trình đánh giá hiệu suất có sự hỗ trợ của AI.","type":"likert","order":9,"textEN":"I have the opportunity to provide input or feedback regarding the AI-assisted performance evaluation process.","section":"Procedural Fairness"},
  {"id":"PF2","text":"Tôi có thể tiếp cận cơ chế phản hồi hoặc xem xét lại nếu cho rằng kết quả đánh giá không phản ánh chính xác hiệu suất của tôi.","type":"likert","order":10,"textEN":"I can access feedback or review mechanisms if I believe the evaluation results do not accurately reflect my performance.","section":"Procedural Fairness"},
  {"id":"PF3","text":"Quy trình đánh giá được áp dụng nhất quán đối với nhân viên.","type":"likert","order":11,"textEN":"The evaluation process is applied consistently to employees.","section":"Procedural Fairness"},
  {"id":"PF4","text":"Quy trình đánh giá giúp giảm thiên kiến trong xử lý dữ liệu và đánh giá.","type":"likert","order":12,"textEN":"The evaluation process helps reduce bias in data processing and assessment.","section":"Procedural Fairness"},
  {"id":"PF5","text":"Quy trình đánh giá dựa trên thông tin phù hợp và liên quan đến công việc.","type":"likert","order":13,"textEN":"The evaluation process is based on relevant and work-related information.","section":"Procedural Fairness"},
  {"id":"PF6","text":"Quy trình đánh giá tuân thủ các chuẩn mực đạo đức trong đánh giá nhân viên.","type":"likert","order":14,"textEN":"The evaluation process complies with ethical standards in employee evaluation.","section":"Procedural Fairness"},
  {"id":"CT1","text":"Tôi tin rằng hệ thống AI hoạt động tốt trong việc hỗ trợ quy trình đánh giá hiệu suất.","type":"likert","order":15,"textEN":"I believe the AI system performs well in supporting the performance evaluation process.","section":"Cognitive Trust"},
  {"id":"CT2","text":"Tôi tin rằng hệ thống AI có năng lực cần thiết để hỗ trợ các quyết định đánh giá hiệu suất.","type":"likert","order":16,"textEN":"I believe the AI system has the necessary competence to support performance evaluation decisions.","section":"Cognitive Trust"},
  {"id":"CT3","text":"Tôi tin rằng hệ thống AI xử lý dữ liệu liên quan đến hiệu suất một cách đáng tin cậy.","type":"likert","order":17,"textEN":"I believe the AI system processes performance-related data reliably.","section":"Cognitive Trust"},
  {"id":"CT4","text":"Tôi tin rằng hệ thống AI áp dụng tiêu chí đánh giá một cách nhất quán khi xử lý thông tin hiệu suất.","type":"likert","order":18,"textEN":"I believe the AI system applies evaluation criteria consistently when processing performance information.","section":"Cognitive Trust"},
  {"id":"DA1","text":"Tôi sẵn sàng chấp nhận kết quả đánh giá hiệu suất có sự hỗ trợ của AI.","type":"likert","order":19,"textEN":"I am willing to accept the AI-assisted performance evaluation results.","section":"Decision Acceptance"},
  {"id":"DA2","text":"Tôi dự định sử dụng kết quả đánh giá của AI như một nguồn tham khảo để cải thiện hiệu suất công việc.","type":"likert","order":20,"textEN":"I intend to use the AI evaluation results as a reference to improve my work performance.","section":"Decision Acceptance"},
  {"id":"DA3","text":"Tôi sẵn sàng làm theo các khuyến nghị cải thiện hiệu suất do hệ thống AI cung cấp.","type":"likert","order":21,"textEN":"I am willing to follow performance improvement recommendations provided by the AI system.","section":"Decision Acceptance"},
  {"id":"DA4","text":"Nếu tổ chức tiếp tục triển khai hệ thống này, tôi dự định tiếp tục sử dụng kết quả và khuyến nghị của hệ thống.","type":"likert","order":22,"textEN":"If the organization continues to implement this system, I intend to continue using the results and recommendations of the system.","section":"Decision Acceptance"},
  {"id":"DA5","text":"Tôi có xu hướng chấp nhận việc tổ chức sử dụng hệ thống AI để hỗ trợ đánh giá hiệu suất của mình.","type":"likert","order":23,"textEN":"I tend to accept the organization's use of an AI system to support the evaluation of my performance.","section":"Decision Acceptance"},
  {"id":"DA6","text":"Tôi sẽ không cố tình né tránh hoặc thay đổi cách hệ thống AI ghi nhận và đánh giá hiệu suất của tôi.","type":"likert","order":24,"textEN":"I will not intentionally avoid or alter the way the AI system records and evaluates my performance.","section":"Decision Acceptance"},
  {"id":"CTRL_AI_FAM","text":"Mức độ am hiểu của Anh/chị về các hệ thống trí tuệ nhân tạo (AI)?","type":"select","order":25,"textEN":"How familiar are you with artificial intelligence (AI) systems?","options":["Rất thấp","Thấp","Trung bình","Cao","Rất cao"],"section":"Biến kiểm soát","required":true,"optionsEN":["Very low","Low","Medium","High","Very high"]},
  {"id":"CTRL_AI_EXP","text":"Anh/chị đã từng sử dụng công cụ AI trong công việc hàng ngày chưa?","type":"select","order":26,"textEN":"Have you used AI tools in your daily work?","options":["Chưa từng","Thỉnh thoảng","Thường xuyên"],"section":"Biến kiểm soát","required":true,"optionsEN":["Never","Occasionally","Regularly"]}
];

const new_qs = [
  ...demographic_qs,
  ...existing_qs,
  ...control_qs
];

new_qs.forEach((q, idx) => {
  q.order = idx + 1;
});

const sql = `UPDATE public.settings SET value = '${JSON.stringify(new_qs).replace(/'/g, "''")}'::jsonb WHERE key = 'hr_questions';`;
fs.writeFileSync('d:/HR_XAI/update_hr_questions.sql', sql, 'utf-8');
console.log('Successfully generated update_hr_questions.sql');
