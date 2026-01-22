// WPS 集成脚本 - 增强调试版

// ===== 全局变量 =====
let backendUrl = 'http://localhost:8001';
let apiKey = '';
let currentSelection = null;
let docProfile = null;
let taskPane = null; // 添加全局 taskPane 变量

// ===== 日志工具 =====
function logToDebug(message, type = 'info') {
    const consoleEl = document.getElementById('debug-console');
    if (!consoleEl) return;

    // 增加时间戳
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `debug-entry ${type === 'error' ? 'debug-error' : type === 'success' ? 'debug-success' : ''}`;
    entry.textContent = `[${time}] ${message}`;

    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;

    // 同时打印到浏览器控制台
    console.log(`[WPS-Plugin] ${message}`);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    // 添加图标
    let icon = '';
    if (type === 'success') icon = '✅ ';
    else if (type === 'error') icon = '❌ ';
    else icon = 'ℹ️ ';

    toast.innerHTML = `<span>${icon}${message}</span>`;

    container.appendChild(toast);

    // 强制重绘以触发动画
    toast.offsetHeight;

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Ribbon 按钮回调 (WPS 调用) =====
// 这些函数在 ribbon.xml 中定义，由 WPS 直接调用
function OnAddinLoad(ribbonUI) {
    // 注意：这里的 console.log 通常在 WPS 内部看不到，除非用调试器连接
    // 此函数在 TaskPane 加载前执行，无法使用 logToDebug
}

function OnOpenTaskPane(control) {
    try {
        // 创建 TaskPane
        // 动态获取当前服务地址 (兼容端口变化)
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/index.html`;

        // 检查是否已存在
        if (taskPane) {
            taskPane.Visible = true;
            return;
        }

        taskPane = wps.CreateTaskPane(url);
        if (taskPane) {
            taskPane.Visible = true;
            taskPane.DockPosition = wps.Enum.msoCTPDockPositionRight;
            taskPane.Width = 400;
        } else {
            // 这里无法使用 showToast，因为 TaskPane 还没加载
            // 只能依赖 WPS 自身的报错或静默失败
            // alert("TaskPane 创建失败"); // 尽量避免 alert
        }
    } catch (e) {
        // alert("打开面板错误: " + e.message);
    }
}

// 快速润色按钮回调
function OnQuickPolish(control) {
    // 检查 TaskPane 是否存在且可见
    if (!taskPane || !taskPane.Visible) {
        OnOpenTaskPane(control);
        // 给一点时间让 TaskPane 加载
        setTimeout(() => {
            // 依然无法直接调用 TaskPane 内部函数，除非使用 postMessage 或其它通讯机制
            // 简化处理：只负责打开面板
        }, 1000);
    }
}

// 设置按钮回调 - 直接打开设置弹窗
function OnSettings(control) {
    // 延迟执行以确保 DOM 已加载
    setTimeout(() => {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.style.display = 'flex';
        } else {
            // 如果弹窗还没加载，先打开面板
            OnOpenTaskPane(control);
            setTimeout(() => {
                const m = document.getElementById('settings-modal');
                if (m) m.style.display = 'flex';
            }, 500);
        }
    }, 100);
}


// ===== 页面初始化 (TaskPane 内部) =====
window.onload = async function () {
    logToDebug('插件页面初始化...', 'info');

    try {
        // 加载设置
        loadSettings();

        // 绑定事件
        setupEventListeners();

        // 检测 WPS 环境
        if (typeof wps !== 'undefined') {
            logToDebug('WPS 环境检测: wps 对象存在', 'success');
            try {
                const app = wps.WpsApplication();
                logToDebug(`WPS 版本: ${app.Version}`, 'info');

                // 启动文档分析
                await initializeDocumentProfile();

                // 启动选区监听
                startSelectionMonitoring();
            } catch (e) {
                logToDebug(`WPS 对象访问异常: ${e.message}`, 'error');
            }
        } else {
            logToDebug('WPS 环境检测: wps 对象不存在 (浏览器模式)', 'warning');
        }

        // 测试后端连接
        await testBackendConnection();

    } catch (error) {
        logToDebug(`初始化致命错误: ${error.message}`, 'error');
        showToast('插件初始化失败', 'error');
    }
};

// ===== 核心功能 =====

// 文档分析
async function initializeDocumentProfile() {
    try {
        updateDocStatus('正在分析...');

        // 获取全文
        const doc = wps.WpsApplication().ActiveDocument;
        // 获取前 2000 字避免过大
        const range = doc.Range(0, Math.min(doc.Content.End, 2000));
        const text = range.Text;

        if (!text || text.length < 10) {
            updateDocStatus('文档内容过少');
            return;
        }

        // 调用后端
        const response = await fetch(`${backendUrl}/api/analyze-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, api_key: apiKey })
        });

        if (response.ok) {
            docProfile = await response.json();
            updateDocStatus(`${docProfile.tone || '通用'} / ${docProfile.genre || '文档'}`);
            logToDebug('文档分析完成', 'success');
        } else {
            updateDocStatus('分析服务异常');
        }
    } catch (e) {
        logToDebug(`文档分析失败: ${e.message}`, 'error');
        updateDocStatus('分析失败');
    }
}

function updateDocStatus(status) {
    const el = document.getElementById('doc-tone');
    if (el) el.textContent = status;
}

// 选区监听 (轮询)
function startSelectionMonitoring() {
    setInterval(() => {
        try {
            if (!wps || !wps.WpsApplication) return;

            const selection = wps.WpsApplication().Selection;
            const text = selection ? selection.Text : "";

            // 只有当选区改变且内容不同时更新
            // 这里简化处理：只要有内容就显示预览
            const previewBox = document.getElementById('selection-preview');
            const previewText = document.getElementById('preview-text');

            if (text && text.trim().length > 0) {
                // 截断显示
                const displayText = text.length > 100 ? text.substring(0, 100) + '...' : text;
                if (previewText.textContent !== displayText) {
                    previewText.textContent = displayText;
                    previewBox.style.display = 'block';
                }
            } else {
                previewBox.style.display = 'none';
            }
        } catch (e) {
            // 忽略频繁的轮询错误
        }
    }, 1000);
}

// 发送指令
async function sendUserMessage() {
    const input = document.getElementById('user-input');
    const command = input.value.trim();

    if (!command) return;
    if (!apiKey) {
        showToast('请先配置 API Key', 'error');
        toggleSettings();
        return;
    }

    // 清空输入
    input.value = '';
    // 恢复高度
    input.style.height = 'auto';

    addMessage(command, 'user');
    showLoading(true);
    logToDebug(`发送指令: ${command}`);

    try {
        let selectedText = "";
        // 获取选区
        if (typeof wps !== 'undefined') {
            try {
                selectedText = wps.WpsApplication().Selection.Text;
            } catch (e) {
                logToDebug(`获取选区失败: ${e.message}`, 'warning');
            }
        }

        if (!selectedText) selectedText = "（无选中文本，仅处理指令）";

        // 调用后端
        const response = await fetch(`${backendUrl}/api/polish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc_profile: docProfile || {},
                selected_text: selectedText,
                user_command: command,
                api_key: apiKey
            })
        });

        if (!response.ok) {
            throw new Error(`API 错误 ${response.status}`);
        }

        const result = await response.json();
        logToDebug('AI 响应成功', 'success');

        addMessage(`✅ ${result.polished_text}`, 'ai');

        // 应用回文档
        if (typeof wps !== 'undefined' && result.polished_text) {
            try {
                const selection = wps.WpsApplication().Selection;
                selection.Range.Text = result.polished_text;

                // 应用格式 (简化版)
                if (result.formatting_actions) {
                    const fmt = result.formatting_actions;
                    if (fmt.bold) selection.Font.Bold = 1;
                    if (fmt.font_name) selection.Font.Name = fmt.font_name;
                    // 其他格式...
                }

                logToDebug('文本已回写到 WPS', 'success');
                showToast('已更新文档内容', 'success');
            } catch (e) {
                logToDebug(`回写文档失败: ${e.message}`, 'error');
                showToast('无法写入文档，请手动复制', 'warning');
            }
        }

    } catch (e) {
        logToDebug(`处理失败: ${e.message}`, 'error');
        addMessage(`❌ 错误: ${e.message}`, 'ai');
        showToast('AI 请求失败', 'error');
    } finally {
        showLoading(false);
    }
}


// ===== UI 辅助 =====
function addMessage(text, type) {
    const container = document.getElementById('messages-container');
    const welcome = container.querySelector('.welcome-message');
    if (welcome) welcome.style.display = 'none';

    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerText = text;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showLoading(show) {
    const el = document.getElementById('loading-indicator');
    if (el) el.style.display = show ? 'flex' : 'none';
}

function updateConnectionStatus(connected) {
    const dot = document.getElementById('connection-indicator');
    const txt = document.getElementById('connection-text');
    if (connected) {
        dot.className = 'indicator online';
        txt.textContent = '已连接';
    } else {
        dot.className = 'indicator offline';
        txt.textContent = '离线';
    }
}

// ===== 设置 =====
function loadSettings() {
    apiKey = localStorage.getItem('zhipu_api_key') || '';
    backendUrl = localStorage.getItem('backend_url') || 'http://localhost:8001';
    if (backendUrl.endsWith('/')) backendUrl = backendUrl.slice(0, -1);

    document.getElementById('api-key-input').value = apiKey;
    document.getElementById('backend-url-input').value = backendUrl;

    logToDebug(`已加载配置. 后端: ${backendUrl}`);
}

function saveSettings() {
    apiKey = document.getElementById('api-key-input').value.trim();
    backendUrl = document.getElementById('backend-url-input').value.trim();
    if (backendUrl.endsWith('/')) backendUrl = backendUrl.slice(0, -1);

    localStorage.setItem('zhipu_api_key', apiKey);
    localStorage.setItem('backend_url', backendUrl);

    showToast('设置已保存', 'success');
    logToDebug('配置已更新');
    testBackendConnection();
}

async function testBackendConnection() {
    logToDebug(`测试连接: ${backendUrl}/health`);
    try {
        const res = await fetch(`${backendUrl}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        if (res.ok) {
            updateConnectionStatus(true);
            logToDebug('连接成功', 'success');
            return true;
        } else {
            throw new Error(res.statusText);
        }
    } catch (e) {
        updateConnectionStatus(false);
        logToDebug(`连接失败: ${e.message}`, 'error');
        return false;
    }
}

function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    // 如果当前是关闭的（display none），则显示
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
        modal.classList.remove('active');
    } else {
        modal.style.display = 'flex';
        // 延时添加 active 类以触发动画（如果有）
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

// ===== 事件绑定 =====
function setupEventListeners() {
    document.getElementById('send-button').addEventListener('click', sendUserMessage);

    const input = document.getElementById('user-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });
    input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    // 设置弹窗事件
    const closeBtn = document.getElementById('close-settings');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        document.getElementById('settings-modal').style.display = 'none';
    });

    // 点击遮罩层关闭
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    document.getElementById('save-settings').addEventListener('click', () => {
        saveSettings();
        // 保存后验证并关闭
        if (apiKey) {
            setTimeout(() => {
                document.getElementById('settings-modal').style.display = 'none';
            }, 500);
        }
    });

    document.getElementById('test-connection').addEventListener('click', async () => {
        const success = await testBackendConnection();
        showToast(success ? '✅ 连接可用' : '❌ 连接失败', success ? 'success' : 'error');
    });

    // 选区清除按钮（如果存在）
    const clearSel = document.getElementById('clear-selection');
    if (clearSel) {
        clearSel.addEventListener('click', () => {
            document.getElementById('selection-preview').style.display = 'none';
        });
    }
}
