from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# 声明基类
Base = declarative_base()

# ===== 数据模型 =====
class UserStyleMemory(Base):
    """用户风格记忆表"""
    __tablename__ = "user_style_memories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_api_key_hash = Column(String(64), index=True, nullable=False, comment="API Key 的 SHA256 哈希值（隐私保护）")
    command = Column(Text, nullable=False, comment="用户输入的指令")
    context = Column(Text, comment="原始文本片段（可选）")
    result = Column(Text, nullable=False, comment="AI 输出结果的 JSON 字符串")
    timestamp = Column(DateTime, default=datetime.utcnow, comment="记录时间")
    
    def __repr__(self):
        return f"<UserStyleMemory(id={self.id}, command='{self.command[:30]}...', timestamp={self.timestamp})>"

# ===== 数据库连接配置 =====
# 从环境变量读取，默认使用本地 PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://wps_user:wps_password@localhost:5432/wps_ai_stylist"
)

# 创建数据库引擎（可选模式）
engine = None
SessionLocal = None

try:
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    engine = create_engine(
        DATABASE_URL,
        echo=False,  # 设为 True 可查看 SQL 日志
        pool_pre_ping=True,  # 连接池健康检查
        pool_size=5,
        max_overflow=10
    )
    
    # 创建会话工厂
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
    
    print(f"✅ 数据库连接成功: {DATABASE_URL.split('@')[-1]}")  # 只打印主机信息
    
except ImportError as e:
    print(f"⚠️ 数据库驱动未安装（{e.name}），RAG 功能将禁用")
    print("   提示：运行 'pip install psycopg2-binary' 启用 PostgreSQL 支持")
except Exception as e:
    print(f"⚠️ 数据库连接失败: {e}")
    print("   继续以无数据库模式运行（不影响核心功能）")

# ===== 初始化数据库（创建表） =====
def init_database():
    """创建所有表（首次运行时调用）"""
    if engine is None:
        raise Exception("数据库引擎未初始化")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("数据库表创建成功")
    except Exception as e:
        print(f"数据库表创建失败: {e}")
        raise

# ===== 辅助函数 =====
def get_db():
    """获取数据库会话（用于依赖注入）"""
    if SessionLocal is None:
        raise Exception("数据库会话工厂未初始化")
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 如果直接运行此文件，则初始化数据库
if __name__ == "__main__":
    print("正在初始化数据库...")
    init_database()
    print("完成！")
