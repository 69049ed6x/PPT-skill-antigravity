import httpx
import json
from typing import Dict, Optional
from prompt_templates import STYLE_ANALYSIS_PROMPT, POLISH_PROMPT

# 智谱 AI API 配置
ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
TIMEOUT = 30.0  # 超时时间（秒）

async def generate_style_profile(text: str, api_key: str) -> Dict:
    """
    分析文档风格特征
    
    Args:
        text: 文档全文（会自动截取前3000字符）
        api_key: 智谱 API Key
        
    Returns:
        {
            "tone": "formal/casual/technical/creative",
            "genre": "report/essay/email/article",
            "professionalism": 1-10
        }
    """
    # 限制长度以控制成本
    truncated_text = text[:3000]
    
    # 构造提示词
    prompt = STYLE_ANALYSIS_PROMPT.format(document_text=truncated_text)
    
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(
                ZHIPU_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "glm-4-flash",
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.1
                }
            )
            
            response.raise_for_status()
            
            # 解析响应
            ai_response = response.json()
            content = ai_response["choices"][0]["message"]["content"]
            
            # 提取 JSON（处理可能的 markdown 代码块）
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            profile = json.loads(content)
            
            # 验证必需字段
            required_fields = ["tone", "genre", "professionalism"]
            for field in required_fields:
                if field not in profile:
                    raise ValueError(f"AI 响应缺少字段: {field}")
            
            return profile
            
    except httpx.TimeoutException:
        raise Exception("智谱 AI 请求超时")
    except httpx.HTTPStatusError as e:
        print(f"API HTTP 错误: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 401:
            raise Exception("API Key 无效或过期")
        raise Exception(f"API 错误: {e.response.status_code}")
    except json.JSONDecodeError:
        raise Exception("AI 返回的 JSON 格式无效")
    except Exception as e:
        raise Exception(f"风格分析失败: {str(e)}")

async def polish_with_formatting(
    doc_profile: Dict,
    user_bias: str,
    selected_text: str,
    user_command: str,
    api_key: str
) -> Dict:
    """
    润色文本并生成格式化指令
    
    Args:
        doc_profile: 文档整体风格档案
        user_bias: 用户历史偏好（来自 RAG）
        selected_text: 选中的文本
        user_command: 用户输入的指令
        api_key: 智谱 API Key
        
    Returns:
        {
            "polished_text": "优化后的文本",
            "formatting_actions": {
                "font_name": "宋体",
                "font_size": 12,
                "bold": true,
                "alignment": 1,
                "line_spacing": 1.5
            }
        }
    """
    # 构造提示词
    prompt = POLISH_PROMPT.format(
        doc_style=json.dumps(doc_profile, ensure_ascii=False),
        user_history=user_bias,
        selected_text=selected_text,
        user_command=user_command
    )
    
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.post(
                ZHIPU_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "glm-4-flash",
                    "messages": [
                        {
                            "role": "system",
                            "content": "你是专业的中文写作润色专家。你必须根据用户指令修改文本内容，绝对不能原样返回。只返回 JSON 格式，不要有任何其他文字。"
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.7
                }
            )
            
            response.raise_for_status()
            
            # 解析响应
            ai_response = response.json()
            content = ai_response["choices"][0]["message"]["content"]
            
            # 调试日志
            print(f"AI 原始响应: {content[:100]}...")
            
            # 提取 JSON (增强版)
            content = content.strip()
            # 尝试找到第一个 { 和最后一个 }
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                content = content[start_idx:end_idx+1]
            
            try:
                result = json.loads(content)
            except json.JSONDecodeError:
                # 尝试通过简单的字符串清理来修复常见错误
                # 例如：在逗号后可能有多余的字符
                import re
                print(f"JSON 解析失败，尝试修复: {content}")
                # 这是一个非常基础的尝试，如果失败则抛出原始错误
                raise
            
            # result = json.loads(content) # Removed redundant load
            
            # 验证结构
            if "polished_text" not in result:
                raise ValueError("AI 响应缺少 polished_text 字段")
            
            # formatting_actions 可选
            if "formatting_actions" not in result:
                result["formatting_actions"] = {}
            
            return result
            
    except httpx.TimeoutException:
        raise Exception("智谱 AI 请求超时")
    except httpx.HTTPStatusError as e:
        print(f"API HTTP 错误: {e.response.status_code} - {e.response.text}")
        if e.response.status_code == 401:
            raise Exception("API Key 无效或过期，请检查设置")
        raise Exception(f"智谱 API 错误: {e.response.status_code}")
    except json.JSONDecodeError as e:
        raise Exception(f"AI 返回的 JSON 格式无效: {content}")
    except Exception as e:
        raise Exception(f"润色处理失败: {str(e)}")
