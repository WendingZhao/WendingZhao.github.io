// ==UserScript==
// @name         智慧树试卷导出PDF
// @namespace    http://tampermonkey.net/
// @icon         https://smartcourseexam.zhihuishu.com/favicon.ico
// @version      1.2
// @description  在新标签页中渲染试题并支持打印
// @author       Snape-max
// @match        https://smartcourseexam.zhihuishu.com/ReviewExam/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // 试题渲染样式
    const printStyles = `
        <style>
            body {
                font-family: "Microsoft YaHei", sans-serif;
                line-height: 1.4;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 10px;
                background-color: white;
                font-size: 14px;
            }
            .question-container {
                background-color: white;
                padding: 10px;
                border-radius: 3px;
                margin-bottom: 10px;
                page-break-inside: avoid;
                border: 1px solid #eee;
            }
            .question-title {
                font-weight: bold;
                margin-bottom: 6px;
                font-size: 15px;
            }
            .question-type {
                color: #666;
                font-size: 13px;
                margin-bottom: 3px;
            }
            .options {
                margin-left: 10px;
            }
            .option {
                margin-bottom: 3px;
                position: relative;
                padding-left: 18px;
            }
            .option.correct {
                color: #4CAF50;
                font-weight: bold;
            }
            .option-number {
                position: absolute;
                left: 0;
            }
            .user-answer {
                color: #2196F3;
                margin-top: 3px;
                font-weight: bold;
                font-size: 13px;
            }
            .result {
                margin-top: 6px;
                padding: 6px;
                border-radius: 3px;
                font-weight: bold;
                font-size: 13px;
            }
            .correct-answer {
                background-color: #e8f5e9;
                color: #2e7d32;
            }
            .wrong-answer {
                background-color: #ffebee;
                color: #c62828;
            }
            .exam-title {
                margin-bottom: 15px;
                text-align: center;
                padding-bottom: 8px;
                border-bottom: 1px solid #ddd;
                font-size: 18px;
            }
            .exam-desc {
                margin-bottom: 15px;
                text-align: center;
                font-size: 13px;
                color: #555;
            }
            .print-controls {
                text-align: center;
                margin: 15px 0;
                padding: 8px;
                background-color: #f5f5f5;
                border-radius: 4px;
            }
            .print-btn {
                background-color: #4CAF50;
                color: white;
                padding: 6px 12px;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                font-size: 13px;
                margin: 0 4px;
            }
            .print-btn:hover {
                background-color: #45a049;
            }
            @media print {
                .print-controls {
                    display: none;
                }
                body {
                    padding: 0;
                    font-size: 11px;
                }
                .question-container {
                    margin-bottom: 8px;
                    padding: 8px;
                }
                .question-title {
                    font-size: 13px;
                }
                .question-type, .option, .result {
                    font-size: 12px;
                }
            }
        </style>
    `;

    // 工具函数：解析 cookie
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
    }

    // 提取 userid
    function getUserIdFromCASLOGCCookie() {
        const caslogc = getCookie("CASLOGC");
        if (!caslogc) return null;
        try {
            const data = JSON.parse(caslogc);
            return data.userId;
        } catch (e) {
            console.error("解析 CASLOGC cookie 失败", e);
            return null;
        }
    }

    // 工具函数：从查询字符串中获取参数
    function getUrlParam(param) {
        const search = window.location.search || "";
        const params = new URLSearchParams(search);
        return params.get(param);
    }

    // 解析路径参数
    function getPathParam(index) {
        const path = window.location.pathname;
        const segments = path.split("/").filter(Boolean);
        return segments[index];
    }

    // 格式化题目内容
    function formatQuestionContent(content) {
        let formatted = content.replace(/（\s*）\s*$/g, '');
        formatted = formatted.replace(/<[^>]+>/g, '');
        return formatted;
    }

    // 获取选项字母
    function getOptionLetter(number) {
        return String.fromCharCode(64 + parseInt(number));
    }

    // 在新标签页中渲染试题
    function renderQuestionsInNewTab(data) {
        // 创建新窗口
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('请允许弹出窗口以查看试题');
            return;
        }

        // 创建HTML内容
        const safeFileName = decodeURI(getPathParam(5)) || '智慧树考试试卷';
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${safeFileName}</title>
                ${printStyles}
            </head>
            <body>
                <div class="exam-title">
                    <h2>${safeFileName}</h2>
                </div>
        `;

        // 添加试题内容
        data.forEach((question, index) => {
            if (!question.content) return;

            // 题目类型和内容
            const typeText = question.questionTypeName ? `${question.questionTypeName}` : '未知题型';
            let questionHtml = `
                <div class="question-container">
                    <div class="question-type">${index + 1}. ${typeText}</div>
                    <div class="question-title">${formatQuestionContent(question.content)}</div>
            `;

            // 选项
            if (question.optionVos && question.optionVos.length > 0) {
                questionHtml += '<div class="options">';

                const sortedOptions = [...question.optionVos].sort((a, b) => a.sort - b.sort);

                sortedOptions.forEach((option, idx) => {
                    questionHtml += `
                        <div class="option ${option.isCorrect ? 'correct' : ''}">
                            <span class="option-number">${String.fromCharCode(65 + idx)}.</span>
                            ${option.content}
                        </div>
                    `;
                });

                questionHtml += '</div>';
            }

            // 用户答案和结果
            if (question.userAnswerVo && question.userAnswerVo.length > 0) {
                const userAnswer = question.userAnswerVo[0];
                const resultClass = userAnswer.isCorrect ? 'correct-answer' : 'wrong-answer';
                let answerText = '未作答';

                if (userAnswer.answer !== null) {
                    if (question.questionType === 1) {
                        // 单选题
                        const selectedOption = question.optionVos?.find(opt => opt.id == userAnswer.answer);
                        if (selectedOption) {
                            answerText = `你的答案: ${getOptionLetter(selectedOption.sort)}.`;
                        }
                    } else if (question.questionType === 2) {
                        // 多选题
                        const answerIds = userAnswer.answer.split('#@#');
                        const selectedOptions = question.optionVos?.filter(opt => answerIds.includes(opt.id.toString()));
                        if (selectedOptions && selectedOptions.length > 0) {
                            answerText = '你的答案: ' + selectedOptions.map(opt => {
                                return `${getOptionLetter(opt.sort)}`;
                            }).join('; ');
                        }
                    } else if (question.questionType === 14) {
                        // 判断题
                        const selectedOption = question.optionVos?.find(opt => opt.id == userAnswer.answer);
                        if (selectedOption) {
                            answerText = `你的答案: ${getOptionLetter(selectedOption.sort)}. ${selectedOption.content}`;
                        }
                    }
                }

                questionHtml += `
                    <div class="result ${resultClass}">
                        <div>${answerText}</div>
                        <div>${userAnswer.isCorrect ? '回答正确' : '回答错误'}</div>
                    </div>
                `;
            }

            questionHtml += '</div>';
            htmlContent += questionHtml;
        });

        // 写入新窗口
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // 自动触发打印（可选，可以注释掉让用户手动点击打印）
        setTimeout(() => {
            try {
                printWindow.print();
            } catch (e) {
                console.log('自动打印失败，请手动点击打印按钮');
            }
        }, 1000);
    }

    /**
     * 获取所有题目并渲染到新标签页
     */
    async function fetchAllQuestionsAndRender(jsonData, key, data) {
        const questionList = [];

        // 从 partSheetVos 中提取所有 questionId
        jsonData.data.partSheetVos.forEach(part => {
            part.questionSheetVos.forEach(q => {
                questionList.push(q.questionId);
            });
        });

        console.log("✅ 需要请求的题目数量:", questionList.length);

        // 创建进度条容器
        const progressContainer = document.createElement('div');
        progressContainer.style.position = 'fixed';
        progressContainer.style.top = '20px';
        progressContainer.style.left = '50%';
        progressContainer.style.transform = 'translateX(-50%)';
        progressContainer.style.width = '300px';
        progressContainer.style.backgroundColor = '#f1f1f1';
        progressContainer.style.borderRadius = '10px';
        progressContainer.style.padding = '5px';
        progressContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        progressContainer.style.zIndex = '99999';

        // 创建进度文本
        const progressText = document.createElement('div');
        progressText.style.textAlign = 'center';
        progressText.style.marginBottom = '5px';
        progressText.style.fontWeight = 'bold';
        progressText.innerText = '导出进度: 0%';
        progressContainer.appendChild(progressText);

        // 创建进度条背景
        const progressBarBackground = document.createElement('div');
        progressBarBackground.style.width = '100%';
        progressBarBackground.style.backgroundColor = '#ddd';
        progressBarBackground.style.borderRadius = '5px';
        progressBarBackground.style.overflow = 'hidden';

        // 创建进度条前景
        const progressBarForeground = document.createElement('div');
        progressBarForeground.style.width = '0%';
        progressBarForeground.style.height = '20px';
        progressBarForeground.style.backgroundColor = '#4CAF50';
        progressBarForeground.style.transition = 'width 0.3s ease';

        progressBarBackground.appendChild(progressBarForeground);
        progressContainer.appendChild(progressBarBackground);
        document.body.appendChild(progressContainer);

        const allQuestionDetails = [];

        for (let i = 0; i < questionList.length; i++) {
            const questionId = questionList[i];
            data.questionId = questionId + "";
            const tmpSecretStr = yxyz(data, key);

            const url = `https://studentexamtest.zhihuishu.com/gateway/t/v1/question/getExamQuestionInfo?secretStr=${encodeURIComponent(tmpSecretStr)}&date=${Date.now()}`;

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include'
                });

                if (!response.ok) throw new Error(`网络响应异常: ${url}`);

                const detailJson = await response.json();

                if (detailJson.code === 0 && detailJson.data) {
                    allQuestionDetails.push(detailJson.data);
                    console.log(`✅ 已获取题目 ${questionId}`);
                } else {
                    console.warn(`⚠️ 获取题目失败: ${questionId}`, detailJson.message);
                }
            } catch (e) {
                console.error(`❌ 请求题目 ${questionId} 失败`, e);
            }

            // 更新进度条
            const progress = Math.round(((i + 1) / questionList.length) * 100);
            progressBarForeground.style.width = `${progress}%`;
            progressText.innerText = `导出进度: ${progress}% (${i + 1}/${questionList.length})`;

            // 控制请求频率避免被封IP
            if (i < questionList.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 25));
            }
        }

        console.log("✅ 所有题目已获取完成");

        // 导出完成后移除进度条
        setTimeout(() => {
            document.body.removeChild(progressContainer);
        }, 1000);

        // 在新标签页中渲染试题
        renderQuestionsInNewTab(allQuestionDetails);
    }

    /**
     * 创建导出按钮
     */
    function createExportButton(startExport, key) {
        const button = document.createElement("button");
        button.innerText = "导出试题";
        button.style.position = "fixed";
        button.style.bottom = "20px";
        button.style.right = "20px";
        button.style.zIndex = "9999";
        button.style.padding = "10px 20px";
        button.style.backgroundColor = "#007bff";
        button.style.color = "#fff";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.cursor = "pointer";
        button.style.fontSize = "16px";

        button.addEventListener("click", () => startExport(key));

        document.body.appendChild(button);
    }

    // 主要执行逻辑
    (async function main() {
        // 1. 获取 userid
        const userId = getUserIdFromCASLOGCCookie() + "";

        // 2. 获取路径参数
        const examTestId = getPathParam(1);

        // 3. 获取查询参数
        const examPaperId = getUrlParam("examPaperId");

        // 4. 构造请求参数
        const data = {
            examTestId,
            examPaperId,
        };

        let json, key;

        try {
            key = await labc(3);
            console.log("获取到密钥", key);

            const secretStr = yxyz(data, key);
            const url = `https://studentexamtest.zhihuishu.com/gateway/t/v1/exam/user/getExamSheetInfo?secretStr=${encodeURIComponent(secretStr)}&date=${Date.now()}`;

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) throw new Error("网络响应异常");
            json = await response.json();
            console.log("✅ 获取到考试试卷数据:", json);

            data.userId = userId;

        } catch (error) {
            console.error("❌ 请求失败:", error);
            return;
        }

        // 创建导出按钮
        createExportButton(async (key) => {
            await fetchAllQuestionsAndRender(json, key, data);
        }, key);
    })();
})();