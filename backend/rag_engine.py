import hashlib
import json
from typing import Optional
from sqlalchemy import desc
from db_models import SessionLocal, UserStyleMemory

# ===== RAG 引擎：用户风格记忆检索与存储 =====

def hash_api_key(api_key: str) -> str:
    """
    对 API Key 进行 SHA256 哈希（隐私保护）
    
    这样即使数据库泄露，也无法反推出原始 API Key
    """
    return hashlib.sha256(api_key.encode('utf-8')).hexdigest()

async def get_user_style_bias(api_key: str, limit: int = 5) -> str:
    """
    检索用户历史风格偏好（RAG 核心功能）
    
    Args:
        api_key: 用户的智谱 API Key
        limit: 返回最近 N 条记录
        
    Returns:
        格式化的历史偏好文本，供 AI 参考
    """
    # 检查数据库是否可用
    if SessionLocal is None:
        return "无历史偏好记录（数据库未配置）"
    
    if not api_key:
        return "无历史偏好记录"
    
    key_hash = hash_api_key(api_key)
    
    try:
        db = SessionLocal()
        
        # 查询最近的交互记录
        recent_memories = db.query(UserStyleMemory)\
            .filter(UserStyleMemory.user_api_key_hash == key_hash)\
            .order_by(desc(UserStyleMemory.timestamp))\
            .limit(limit)\
            .all()
        
        db.close()
        
        if not recent_memories:
            return "无历史偏好记录（首次使用）"
        
        # 组装成上下文文本
        bias_lines = []
        for memory in reversed(recent_memories):  # 时间正序
            try:
                result_data = json.loads(memory.result)
                formatting = result_data.get('formatting_actions', {})
                
                # 提取关键特征
                style_features = []
                if formatting.get('font_name'):
                    style_features.append(f"字体:{formatting['font_name']}")
                if formatting.get('bold'):
                    style_features.append("加粗")
                if formatting.get('alignment') == 1:
                    style_features.append("居中")
                
                bias_lines.append(
                    f"- 指令: \"{memory.command}\" → 偏好: {', '.join(style_features) if style_features else '纯文本优化'}"
                )
            except:
                # 忽略解析失败的记录
                continue
        
        if not bias_lines:
            return "无有效历史偏好"
        
        return "\n".join(bias_lines)
        
    except Exception as e:
        print(f"RAG 检索失败: {e}")
        return "历史偏好检索失败"

async def store_interaction(
    api_key: str,
    command: str,
    result: dict,
    context: Optional[str] = None
) -> bool:
    """
    存储用户交互记录（更新 RAG 知识库）
    
    Args:
        api_key: 用户的智谱 API Key
        command: 用户指令
        result: AI 返回的结果（dict）
        context: 原始文本（可选）
        
    Returns:
        是否存储成功
    """
    # 检查数据库是否可用
    if SessionLocal is None:
        print("数据库未配置，跳过交互记录存储")
        return False
    
    if not api_key or not command:
        return False
    
    key_hash = hash_api_key(api_key)
    
    try:
        db = SessionLocal()
        
        # 创建记录
        memory = UserStyleMemory(
            user_api_key_hash=key_hash,
            command=command,
            context=context or "",
            result=json.dumps(result, ensure_ascii=False)
        )
        
        db.add(memory)
        db.commit()
        db.close()
        
        print(f"RAG 存储成功: 用户 {key_hash[:8]}... 指令 \"{command[:30]}...\"")
        return True
        
    except Exception as e:
        print(f"RAG 存储失败: {e}")
        return False

async def clear_user_history(api_key: str) -> int:
    """
    清除用户历史记录（隐私功能）
    
    Args:
        api_key: 用户的智谱 API Key
        
    Returns:
        删除的记录数量
    """
    if not api_key:
        return 0
    
    key_hash = hash_api_key(api_key)
    
    try:
        db = SessionLocal()
        
        deleted_count = db.query(UserStyleMemory)\
            .filter(UserStyleMemory.user_api_key_hash == key_hash)\
            .delete()
        
        db.commit()
        db.close()
        
        print(f"已清除用户 {key_hash[:8]}... 的 {deleted_count} 条历史记录")
        return deleted_count
        
    except Exception as e:
        print(f"清除历史失败: {e}")
        return 0

async def get_user_stats(api_key: str) -> dict:
    """
    获取用户统计信息
    
    Args:
        api_key: 用户的智谱 API Key
        
    Returns:
        {
            "total_interactions": int,
            "most_common_command": str,
            "first_use": datetime,
            "last_use": datetime
        }
    """
    if not api_key:
        return {}
    
    key_hash = hash_api_key(api_key)
    
    try:
        db = SessionLocal()
        
        memories = db.query(UserStyleMemory)\
            .filter(UserStyleMemory.user_api_key_hash == key_hash)\
            .all()
        
        db.close()
        
        if not memories:
            return {"total_interactions": 0}
        
        # 统计最常用的指令（简化版）
        command_counts = {}
        for m in memories:
            key = m.command[:20]  # 取前20个字符作为键
            command_counts[key] = command_counts.get(key, 0) + 1
        
        most_common = max(command_counts.items(), key=lambda x: x[1])[0] if command_counts else "无"
        
        return {
            "total_interactions": len(memories),
            "most_common_command": most_common,
            "first_use": min(m.timestamp for m in memories).isoformat(),
            "last_use": max(m.timestamp for m in memories).isoformat()
        }
        
    except Exception as e:
        print(f"获取统计失败: {e}")
        return {"error": str(e)}
