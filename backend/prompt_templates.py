# 提示工程模板

STYLE_ANALYSIS_PROMPT = """
请分析以下文档的整体风格特征，并以 JSON 格式返回结果。

文档内容（节选）：
{document_text}

分析要求：
1. **tone**（语气）: 选择以下之一
   - formal: 正式、严谨的学术或商务语气
   - casual: 轻松、口语化的语气
   - technical: 技术性、专业术语较多
   - creative: 创意性、文学性强
   
2. **genre**（类型）: 选择以下之一
   - report: 报告（工作报告、研究报告）
   - essay: 论文或文章
   - email: 邮件或信函
   - article: 文章（新闻、博客等）
   - story: 故事或小说
   
3. **professionalism**（专业度）: 1-10 的评分
   - 1-3: 非正式、个人化
   - 4-6: 一般正式
   - 7-10: 高度专业、学术性

请仅返回 JSON 格式，不要包含其他文字说明。

示例输出：
{{"tone": "formal", "genre": "report", "professionalism": 8}}
"""

POLISH_PROMPT = """
你是一位专业的中文写作专家。你的任务是根据用户指令修改和润色文本。

【原始文本】
{selected_text}

【用户指令】
{user_command}

【文档风格参考（可选）】
{doc_style}

【用户偏好（可选）】
{user_history}

**重要规则**：
1. **必须修改文本**：不要返回原文，必须根据用户指令进行实质性修改
2. **常见指令含义**：
   - "更简洁/精简"：删减冗余词句，保留核心意思
   - "更正式/专业"：使用书面语，避免口语化表达
   - "更通俗/易懂"：使用简单词汇，拆分长句
   - "改写/重写"：用不同的方式表达相同意思
   - "润色"：改善文字流畅度和表达质量
3. **保持长度相近**：除非用户要求扩展或精简，否则修改后的文本长度应与原文相近
4. **保留核心信息**：不要遗漏原文中的关键信息

请返回以下 JSON 格式（仅返回 JSON，无其他文字）：

{{
  "polished_text": "修改后的完整文本（必须与原文不同）",
  "formatting_actions": {{
    "font_name": "宋体",
    "font_size": 12,
    "bold": false,
    "alignment": 0,
    "line_spacing": 1.5
  }}
}}

注意：formatting_actions 为可选，如用户未要求格式修改可留空 {{}}
"""

