from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ai_service
import rag_engine
from typing import Optional, Dict

app = FastAPI(
    title="WPS AI Stylist Backend",
    description="基于智谱 AI 的文档样式优化后端服务",
    version="1.0.0"
)

# CORS 配置 - 允许 WPS 插件跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== 数据模型 =====
class AnalyzeRequest(BaseModel):
    text: str
    api_key: str

class PolishRequest(BaseModel):
    doc_profile: Optional[Dict] = {}
    selected_text: str
    user_command: str
    api_key: str

# ===== API 端点 =====

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy", "service": "wps-ai-stylist"}

@app.post("/api/analyze-document")
async def analyze_document(req: AnalyzeRequest):
    """
    Phase 1: 分析文档整体风格
    
    输入: 文档全文
    输出: {tone, genre, professionalism}
    """
    try:
        if not req.text or len(req.text) < 50:
            raise HTTPException(status_code=400, detail="文档内容过短")
        
        if not req.api_key:
            raise HTTPException(status_code=400, detail="API Key 未提供")
        
        # 调用 AI 服务
        profile = await ai_service.generate_style_profile(
            req.text,
            req.api_key
        )
        
        return profile
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"文档分析错误: {e}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")

@app.post("/api/polish")
async def polish_text(req: PolishRequest):
    """
    Phase 3: AI 文本润色 + 格式推理
    
    输入: 文档风格档案 + 用户指令 + 选中文本
    输出: {polished_text, formatting_actions}
    """
    try:
        if not req.selected_text or len(req.selected_text.strip()) == 0:
            raise HTTPException(status_code=400, detail="选中文本为空")
        
        if not req.api_key:
            raise HTTPException(status_code=400, detail="API Key 未提供")
        
        # 获取用户历史风格偏好（RAG）
        user_bias = await rag_engine.get_user_style_bias(req.api_key)
        
        # 调用智谱 AI 进行润色
        result = await ai_service.polish_with_formatting(
            doc_profile=req.doc_profile,
            user_bias=user_bias,
            selected_text=req.selected_text,
            user_command=req.user_command,
            api_key=req.api_key
        )
        
        # 存储此次交互以更新 RAG
        await rag_engine.store_interaction(
            req.api_key,
            req.user_command,
            result
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"润色处理错误: {e}")
        raise HTTPException(status_code=500, detail=f"处理失败: {str(e)}")

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "WPS AI Stylist Backend API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
