// WPS 集成脚本 - 连接 WPS API 和后端服务

// ===== 全局变量 =====
let backendUrl = 'http://localhost:8000';
let apiKey = '';
let currentSelection = null;
let docProfile = null;
let wpsApp = null;

// ===== WPS 初始化 =====
window.onload = async function () {
    console.log('WPS 插件加载中...');

    try {
        // 获取 WPS Application 对象
        wpsApp = Application;
        console.log('✅ WPS Application 已连接');

        // 加载设置
        loadSettings();

        // 绑定事件
        setupEventListeners();

        // 启动文档扫描
        await initializeDocumentProfile();

        // 启动选择监听
        startSelectionMonitoring();

        // 测试后端
        await testBackendConnection();

    } catch (error) {
        console.error('❌ WPS 初始化失败:', error);
        alert('WPS 连接失败，请确认插件在 WPS 环境中运行');
    }
};

// ===== Ribbon 按钮回调函数 =====
let taskPane = null;

function OnAddinLoad(ribbonUI) {
    console.log('✅ Ribbon UI 已加载');
}

function OnOpenTaskPane(control) {
    console.log('打开 TaskPane 面板');

    try {
        // 如果 TaskPane 已存在，直接显示
        if (taskPane) {
            taskPane.Visible = true;
            console.log('✅ TaskPane 已显示');
            return;
        }

        // 创建新的 TaskPane
        const taskPaneUrl = "http://127.0.0.1:3889/index.html";
        taskPane = wps.CreateTaskPane(taskPaneUrl);

        if (taskPane) {
            taskPane.Visible = true;
            taskPane.DockPosition = wps.Enum.msoCTPDockPositionRight; // 停靠在右侧
            taskPane.Width = 400; // 宽度 400px
            console.log('✅ TaskPane 创建并显示成功');
        } else {
            console.error('❌ TaskPane 创建失败');
            alert('无法打开插件面板，请确认 WPS 版本支持');
        }
    } catch (error) {
        console.error('❌ TaskPane 创建错误:', error);
        alert('打开面板失败: ' + error.message);
    }
}

function OnQuickPolish(control) {
    console.log('快速润色');
    if (!apiKey) {
        alert('请先配置智谱 API Key\n\n步骤：\n1. 点击"打开面板"按钮\n2. 在面板底部找到"设置"\n3. 填写 API Key 并保存');
        return;
    }
    quickPolish();
}

function OnSettings(control) {
    console.log('打开设置');
    // 先打开 TaskPane
    OnOpenTaskPane(control);
}

// ===== Phase 1: 文档扫描 =====
async function initializeDocumentProfile() {
    try {
        updateDocProfileStatus('分析中...');

        const doc = wpsApp.ActiveDocument;
        const fullText = doc.Content.Text;

        if (!fullText || fullText.length < 50) {
            updateDocProfileStatus('文档过短');
            return;
        }

        const response = await fetch(`${backendUrl}/api/analyze-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: fullText,
                api_key: apiKey
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        docProfile = await response.json();
        sessionStorage.setItem('doc_profile', JSON.stringify(docProfile));

        updateDocProfileStatus(
            `${docProfile.tone || '未知'} / ${docProfile.genre || '未知'}`
        );

        console.log('✅ 文档风格分析完成:', docProfile);

    } catch (error) {
        console.error('文档分析失败:', error);
        updateDocProfileStatus('分析失败');
    }
}

function updateDocProfileStatus(status) {
    const element = document.getElementById('doc-tone');
    if (element) element.textContent = status;
}

// ===== Phase 2: 选择监听 =====
function startSelectionMonitoring() {
    // WPS 选择变化事件
    setInterval(async () => {
        try {
            const selection = wpsApp.ActiveDocument.ActiveWindow.Selection;
            const selectedText = selection.Text;

            currentSelection = selection;

            const previewBox = document.getElementById('selection-preview');
            const previewText = document.getElementById('preview-text');

            if (selectedText && selectedText.trim().length > 0) {
                previewText.textContent = selectedText;
                previewBox.style.display = 'block';
            } else {
                previewBox.style.display = 'none';
            }
        } catch (error) {
            // 忽略选择错误
        }
    }, 500);
}

// ===== Phase 3: AI 润色 =====
async function sendUserMessage() {
    const inputField = document.getElementById('user-input');
    const userCommand = inputField.value.trim();

    if (!userCommand) {
        alert('请输入指令');
        return;
    }

    if (!apiKey) {
        alert('请先在设置中配置智谱 API Key');
        toggleSettings();
        return;
    }

    inputField.value = '';
    addMessageToChat(userCommand, 'user');
    showLoading(true);

    try {
        const selection = wpsApp.ActiveDocument.ActiveWindow.Selection;
        const selectedText = selection.Text;

        if (!selectedText || selectedText.trim().length === 0) {
            throw new Error('请先选中要优化的文本');
        }

        const response = await fetch(`${backendUrl}/api/polish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                doc_profile: docProfile || {},
                selected_text: selectedText,
                user_command: userCommand,
                api_key: apiKey
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        const result = await response.json();

        addMessageToChat(
            `✅ 已优化文本并应用格式\n\n预览: ${result.polished_text.substring(0, 100)}...`,
            'ai'
        );

        // Phase 4: 应用格式
        await applyFormattingActions(selection, result);

    } catch (error) {
        console.error('AI 处理失败:', error);
        addMessageToChat(`❌ 错误: ${error.message}`, 'ai');
    } finally {
        showLoading(false);
    }
}

// 快速润色
async function quickPolish() {
    document.getElementById('user-input').value = '优化这段文本';
    await sendUserMessage();
}

// ===== Phase 4: 格式应用 =====
async function applyFormattingActions(selection, result) {
    try {
        const range = selection.Range;

        // 替换文本
        if (result.polished_text) {
            range.Text = result.polished_text;
        }

        const fmt = result.formatting_actions || {};
        if (Object.keys(fmt).length === 0) return;

        const font = range.Font;
        const paragraphFormat = range.ParagraphFormat;

        if (fmt.font_name) font.Name = fmt.font_name;
        if (fmt.font_size) font.Size = fmt.font_size;
        if (fmt.bold !== undefined) font.Bold = fmt.bold ? -1 : 0;
        if (fmt.italic !== undefined) font.Italic = fmt.italic ? -1 : 0;
        if (fmt.alignment !== undefined) paragraphFormat.Alignment = fmt.alignment;
        if (fmt.line_spacing) {
            paragraphFormat.LineSpacingRule = 5;
            paragraphFormat.LineSpacing = fmt.line_spacing * 12;
        }

        console.log('✅ 格式应用成功:', fmt);

    } catch (error) {
        console.error('格式应用失败:', error);
        throw new Error('格式应用失败: ' + error.message);
    }
}

// ===== UI 辅助函数 =====
function addMessageToChat(content, type) {
    const messagesContainer = document.getElementById('messages-container');
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) welcomeMsg.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = content;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

function updateConnectionStatus(connected) {
    const indicator = document.getElementById('connection-indicator');
    const text = document.getElementById('connection-text');

    if (connected) {
        indicator.className = 'indicator online';
        text.textContent = '已连接';
    } else {
        indicator.className = 'indicator offline';
        text.textContent = '离线';
    }
}

// ===== 设置管理 =====
function loadSettings() {
    apiKey = localStorage.getItem('zhipu_api_key') || '';
    backendUrl = localStorage.getItem('backend_url') || 'http://localhost:8000';

    document.getElementById('api-key-input').value = apiKey;
    document.getElementById('backend-url-input').value = backendUrl;
}

function saveSettings() {
    apiKey = document.getElementById('api-key-input').value.trim();
    backendUrl = document.getElementById('backend-url-input').value.trim();

    localStorage.setItem('zhipu_api_key', apiKey);
    localStorage.setItem('backend_url', backendUrl);

    alert('✅ 设置已保存');
    testBackendConnection();
}

async function testBackendConnection() {
    try {
        const response = await fetch(`${backendUrl}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
            updateConnectionStatus(true);
            return true;
        } else {
            updateConnectionStatus(false);
            return false;
        }
    } catch (error) {
        console.error('连接测试失败:', error);
        updateConnectionStatus(false);
        return false;
    }
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('collapsed');
}

// ===== 事件监听 =====
function setupEventListeners() {
    document.getElementById('send-button').addEventListener('click', sendUserMessage);

    document.getElementById('user-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });

    document.getElementById('clear-selection').addEventListener('click', () => {
        document.getElementById('selection-preview').style.display = 'none';
    });

    document.getElementById('toggle-settings').addEventListener('click', toggleSettings);
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('test-connection').addEventListener('click', async () => {
        const success = await testBackendConnection();
        alert(success ? '✅ 连接成功' : '❌ 连接失败，请检查后端服务');
    });
}
