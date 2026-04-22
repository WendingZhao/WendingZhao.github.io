// ==UserScript==
// @name         智慧树试卷导出
// @namespace    http://tampermonkey.net/
// @icon         https://smartcourseexam.zhihuishu.com/favicon.ico
// @version      1.1
// @description  自动获取考试信息并请求 getExamTestUserInfo 接口
// @author       Snape-max
// @match        https://smartcourseexam.zhihuishu.com/ReviewExam/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

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
        const segments = path.split("/").filter(Boolean); // 过滤空值
        return segments[index];
    }

    /**
     * 获取所有题目并导出为 JSON 文件
     */
    async function fetchAllQuestionsAndExport(jsonData, key, data, examTestDescribe) {
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
                await new Promise(resolve => setTimeout(resolve, 25)); // 每次请求间隔25ms
            }
        }

        console.log("✅ 所有题目已获取完成");

        // 导出完成后移除进度条
        setTimeout(() => {
            document.body.removeChild(progressContainer);
        }, 1000);

        const safeFileName = decodeURI(getPathParam(5));

        // 导出为 JSON 文件
        const blob = new Blob([JSON.stringify(allQuestionDetails, null, 2)], { type: "application/json" });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${safeFileName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
    }

    /**
     * 创建下载按钮
     */
    function createDownloadButton(startExport, key) {
        const button = document.createElement("button");
        button.innerText = "导出试卷";
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

        // 点击事件绑定到导出逻辑
        button.addEventListener("click", () => startExport(key));

        document.body.appendChild(button);
    }

    // 主要执行逻辑
    (async function main() {
        // 1. 获取 userid
        const userId = getUserIdFromCASLOGCCookie() + "";

        // 2. 获取路径参数
        const examTestId = getPathParam(1); // 第三个路径段

        // 3. 获取查询参数
        const examPaperId = getUrlParam("examPaperId");

        // 4. 构造请求参数
        const data = {
            examTestId,
            examPaperId,
        };

        let json, userInfoJson, key;

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
            json = await response.json();  // 所有试题信息
            console.log("✅ 获取到考试试卷数据:", json);

            data.userId = userId;


        } catch (error) {
            console.error("❌ 请求失败:", error);
            return;
        }

        // 创建下载按钮，并绑定导出逻辑
        createDownloadButton(async (key) => {
            await fetchAllQuestionsAndExport(json, key, data); // 获取所有试题信息
        }, key);

    })();
})();