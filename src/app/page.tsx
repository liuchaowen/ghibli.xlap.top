"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ShowCase from "@/components/ShowCase";
import { useCallback } from "react";

// ShowCases组件用于从case.json读取数据并渲染ShowCase组件
interface ShowCasesProps {
  ossHost: string;
}

const ShowCases: React.FC<ShowCasesProps> = ({ ossHost }) => {
  const [cases, setCases] = useState<Array<{ original: string; effect: string }>>([]);

  // 加载案例数据
  useEffect(() => {
    const loadCases = async () => {
      try {
        const response = await fetch('/data/case.json');
        if (!response.ok) {
          throw new Error('Failed to fetch case data');
        }
        const data = await response.json();
        setCases(data);
      } catch (error) {
        console.error('Error loading case data:', error);
      }
    };

    loadCases();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
      {cases.map((item, index) => (
        <div key={index} className="showcase-item">
          <div className="w-full">
            <ShowCase original={item.original} effect={item.effect} ossHost={ossHost} />
          </div>
        </div>
      ))}
    </div>
  );
};

// 图片尺寸选项
interface ImageSizeOption {
  id: string;
  label: string;
  value: string;
}

const imageSizeOptions: ImageSizeOption[] = [
  { id: "square", label: "正方形(1:1)", value: "1024x1024" },
  { id: "landscape", label: "横图(16:9)", value: "1792x1024" },
  { id: "portrait", label: "竖图(9:16)", value: "1024x1792" }
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [mode, setMode] = useState<"text2img" | "img2img">("img2img"); // 默认为文生图模式
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [xKey, setXKey] = useState<string>("");
  const [isValidKey, setIsValidKey] = useState<boolean | null>(null);
  const [imageSize, setImageSize] = useState<string>("1024x1024"); // 默认为1:1尺寸
  const [showQRCode, setShowQRCode] = useState(false); // 控制二维码显示
  const [showHelpTooltip, setShowHelpTooltip] = useState(false); // 控制帮助tooltip显示
  const contactRef = useRef<HTMLSpanElement>(null); // 联系我元素的引用
  const helpRef = useRef<HTMLDivElement>(null); // 帮助图标元素的引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiHost = "https://api.xlap.top/v1";
  const ossHost = "https://xlaptop.oss-cn-hongkong.aliyuncs.com/ghiblix/"

  useEffect(() => {
    // 从localStorage加载保存的X Key
    const savedKey = localStorage.getItem("x-api-key");
    if (savedKey) {
      setXKey(savedKey);
      validateXKey(savedKey);
    }
    setBackgroundImage(ossHost + "bg.png");
  }, []);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setError("请上传图片文件");
        return;
      }
      setUploadedImage(file);
      setError("");
    }
  };

  // 切换到文生图模式
  const switchToText2Img = () => {
    setMode("text2img");
    setUploadedImage(null);
    setImageSize("1024x1024"); // 重置为默认尺寸 1:1
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 切换到图生图模式
  const switchToImg2Img = () => {
    setMode("img2img");
  };

  // 验证X Key格式
  const validateXKey = (key: string): boolean => {
    // 验证key是否以sk-开头并且总长度为51位
    const isValid = key.startsWith('sk-') && key.length === 51;
    setIsValidKey(isValid);
    return isValid;
  };

  // 处理X Key输入变化
  const handleXKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setXKey(newKey);
  };

  // X Key输入框失焦时验证
  const handleXKeyBlur = () => {
    if (xKey.trim() !== '') {
      const isValid = validateXKey(xKey);
      if (isValid) {
        // 保存有效的key到localStorage
        localStorage.setItem('x-api-key', xKey);
      }
    } else {
      setIsValidKey(null);
    }
  };

  // 清除X Key
  const clearXKey = () => {
    setXKey('');
    setIsValidKey(null);
    localStorage.removeItem('x-api-key');
  };

  const generateImage = async () => {

    if (mode === "img2img" && !uploadedImage) {
      setError("请上传一张图片");
      return;
    }

    setIsLoading(true);
    setError("");
    setImageUrl("");
    // 检查是否有有效的X Key
    if (!xKey || isValidKey !== true) {
      setError("未填写X Key或X Key格式无效");
      setIsLoading(false);
      return;
    }

    try {
      if (mode === "text2img") {
        // 文生图模式 - 直接调用第三方API
        // 构建增强的提示词，添加吉卜力风格的描述
        const enhancedPrompt = `以吉卜力工作室风格创建一张图片：${prompt}。使用宫崎骏特有的艺术风格，包括柔和的色彩、精致的细节、梦幻的场景和独特的角色设计。`;

        // 构建请求数据
        const requestData = {
          prompt: enhancedPrompt,
          sync_mode: false,
          model: "sora_image", // 使用Sora图像模型
          n: 1, // 生成1张图片,
          size: imageSize // 使用用户选择的尺寸
        };

        // 直接调用第三方API
        const response = await fetch(apiHost + "/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${xKey}`
          },
          body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error.message || "图片生成失败");
        }
        // 处理新的API响应格式
        if (data.data && data.data.length > 0) {
          // 新的图像生成API可能直接返回URL或base64数据
          if (data.data[0].url) {
            // 如果返回的是URL
            setImageUrl(data.data[0].url);
          } else if (data.data[0].b64_json) {
            // 如果返回的是base64数据
            const imageData = `data:image/jpeg;base64,${data.data[0].b64_json}`;
            setImageUrl(imageData);
          } else {
            throw new Error("API返回的数据格式不正确");
          }
        } else {
          // 兼容旧格式处理
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            // 使用正则表达式提取base64数据
            const b64Match = reply.match(/base64,([^"]+)/);
            if (b64Match && b64Match[1]) {
              const imageData = `data:image/jpeg;base64,${b64Match[1]}`;
              setImageUrl(imageData);
            } else {
              throw new Error("未能从回复中解析到图片数据");
            }
          } else {
            throw new Error("API未返回有效内容");
          }
        }
      } else {
        // 图生图模式
        // 创建FormData对象来发送文件
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("image", uploadedImage as File);
        return await handleImg2ImgRequest(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片生成过程中发生错误");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理图生图请求
  const handleImg2ImgRequest = async (formData: FormData) => {
    // 检查是否有有效的X Key
    if (!xKey || isValidKey !== true) {
      setError("未填写X Key或X Key格式无效");
      setIsLoading(false);
      return;
    }

    try {
      // 获取原始提示词
      const originalPrompt = formData.get('prompt') as string;
      const image = formData.get('image') as File;

      // 构建增强的提示词，添加吉卜力风格的描述
      const enhancedPrompt = `以吉卜力工作室风格修改此图片：${originalPrompt}。使用宫崎骏特有的艺术风格，包括柔和的色彩、精致的细节、梦幻的场景和独特的角色设计。`;

      // 创建新的FormData对象用于API请求
      const apiFormData = new FormData();
      apiFormData.append('prompt', enhancedPrompt);
      apiFormData.append('model', 'flux-kontext-pro'); // 支持 gpt-image-1、flux-kontext-pro、flux-kontext-max
      apiFormData.append('sync_mode', 'false'); // 同步模式
      apiFormData.append('image', image);

      // 直接调用第三方API
      const response = await fetch(apiHost + "/images/edits", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${xKey}`
          // 不需要设置Content-Type，fetch会根据FormData自动设置
        },
        body: apiFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "图片生成失败");
      }

      // 处理新的API响应格式
      if (data.data && data.data.length > 0) {
        // 新的图像生成API可能直接返回URL或base64数据
        if (data.data[0].url) {
          // 如果返回的是URL
          setImageUrl(data.data[0].url);
        } else if (data.data[0].b64_json) {
          // 如果返回的是base64数据
          const imageData = `data:image/jpeg;base64,${data.data[0].b64_json}`;
          setImageUrl(imageData);
        } else {
          throw new Error("API返回的数据格式不正确");
        }
      } else {
        // 兼容旧格式处理
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          // 使用正则表达式提取base64数据
          const b64Match = reply.match(/base64,([^"]+)/);
          if (b64Match && b64Match[1]) {
            const imageData = `data:image/jpeg;base64,${b64Match[1]}`;
            setImageUrl(imageData);
          } else {
            throw new Error("未能从回复中解析到图片数据");
          }
        } else {
          throw new Error("API未返回有效内容");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片生成过程中发生错误");
    } finally {
      setIsLoading(false);
    }
  };

  // 添加滚动处理函数
  useEffect(() => {
    const handleScroll = () => {
      // 获取当前滚动位置
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;

      // 根据滚动位置设置当前页面
      if (scrollPosition < windowHeight * 0.5) {
        // 第一页
      } else if (scrollPosition < windowHeight * 1.5) {
        // 第二页
      } else {
        // 第三页
      }
    };

    // 添加滚动事件监听
    window.addEventListener('scroll', handleScroll);

    // 清理函数
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 处理页面导航
  const scrollToPage = useCallback((pageIndex: number) => {
    const scrollContainer = document.querySelector('.snap-y.snap-mandatory');
    const targetElement = document.querySelectorAll('.snap-start')[pageIndex];

    if (scrollContainer && targetElement) {
      // 计算目标元素相对于滚动容器的偏移量
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const relativeOffset = targetRect.top - containerRect.top + scrollContainer.scrollTop;

      // 滚动到目标位置
      scrollContainer.scrollTo({
        top: relativeOffset,
        behavior: 'smooth'
      });
    } else {
      // 回退方法，使用窗口高度计算
      const windowHeight = window.innerHeight;
      window.scrollTo({
        top: windowHeight * pageIndex,
        behavior: 'smooth'
      });
    }
  }, []);

  return (
    <div className="snap-y snap-mandatory h-screen overflow-y-auto">
      <div className="page-first flex items-center min-h-screen relative snap-start">
        {/* 使用CSS背景图片，只有当backgroundImage有值时才设置样式 */}
        <div
          className="absolute inset-0 w-full h-full z-0"
          style={backgroundImage ? {
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}}
        ></div>
        <div className="absolute top-10 right-20">
          <div className="flex justify-end mb-4">
            <div className="flex space-x-4">
              <a
                href="https://api.xlap.top"
                target="_blank"
                rel="noopener noreferrer"
                title="AI中转站"
                className="px-3 py-1 bg-black/70 hover:bg-black text-white rounded-md transition-colors text-sm"
              >
                X API
              </a>
              <a
                href="https://nano.xlap.top"
                target="_blank"
                rel="noopener noreferrer"
                title="纳米香蕉"
                className="px-3 py-1 bg-black/70 hover:bg-black text-white rounded-md transition-colors text-sm"
              >
                Nano Banana X
              </a>
              <a
                href="https://sora.xlap.top"
                target="_blank"
                rel="noopener noreferrer"
                title="Sora2X"
                className="px-3 py-1 bg-black/70 hover:bg-black text-white rounded-md transition-colors text-sm"
              >
                Sora2X
              </a>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-12 relative z-10 text-white">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              吉卜力风格图像生成器 GhibliX
            </h1>
            <p className="text-lg text-white text-opacity-90 max-w-2xl mx-auto drop-shadow-md">
              第三方AI接口平台 <a target="_blank" href="https://api.xlap.top">X API</a>，文生图<b>￥0.075</b><small>/次</small>，图生图<b>￥0.18</b><small>/次</small>，注册送<b>￥0.3</b>
            </p>
          </header>

          <div className="max-w-3xl mx-auto rounded-xl shadow-lg p-6" style={{ backgroundColor: "rgba(227, 218, 173, 0.8)" }} >
            {/* 文生图/图生图切换链接和X Key输入框在同一行 */}
            <div className="flex justify-between items-center mb-4 text-black">
              {/* 文生图/图生图切换链接 */}
              <div className="flex gap-2">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); switchToImg2Img(); }}
                  className={`${mode === "img2img" ? "font-bold underline" : "hover:underline"}`}
                >
                  图生图
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); switchToText2Img(); }}
                  className={`mr-4 ${mode === "text2img" ? "font-bold underline" : "hover:underline"}`}
                >
                  文生图
                </a>
              </div>
              {/* X Key输入框 */}
              <div className="flex items-center text-black">
                <div className="relative w-64">
                  <input
                    type="text"
                    value={xKey}
                    onChange={handleXKeyChange}
                    onBlur={handleXKeyBlur}
                    placeholder="请输入X Key"
                    className="w-full px-3 py-2 rounded-md text-sm outline-none"
                    style={{ backgroundColor: "rgba(227, 218, 173, 0.8)" }}
                  />
                </div>

                {/* 获取链接或清除按钮 */}
                <div className="ml-2 flex items-center gap-1">
                  <div className="flex items-center pr-1">
                    {isValidKey === true && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {isValidKey === false && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {(!xKey || isValidKey === false) && (
                    <div className="flex items-center gap-1 relative">
                      <a
                        href="https://api.xlap.top"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 text-sm hover:underline"
                      >
                        获取
                      </a>
                      <div
                        ref={helpRef}
                        className="relative cursor-help"
                        onMouseEnter={() => setShowHelpTooltip(true)}
                        onMouseLeave={() => setShowHelpTooltip(false)}
                      >
                        <svg
                          className="w-4 h-4 text-gray-500 hover:text-gray-700"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>

                        {/* 帮助tooltip */}
                        {showHelpTooltip && (
                          <div
                            className="absolute bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg z-50 whitespace-nowrap"
                            style={{
                              left: '50%',
                              bottom: '100%',
                              transform: 'translateX(-50%)',
                              marginBottom: '8px',
                              minWidth: '200px'
                            }}
                          >
                            <div className="text-left">
                              <div>1、注册登录X API平台</div>
                              <div>2、添加令牌，自定义名称，default分组即可</div>
                              <div>3、充值余额，复制key至左侧</div>
                            </div>
                            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {xKey && (
                    <a onClick={clearXKey} className="text-gray-600 text-sm hover:underline">
                      清除
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className={`flex ${mode === "text2img" ? "" : "mb-6"}`}>
              {/* 图生图模式下显示文件上传框 */}
              {mode === "img2img" && (
                <div className="mr-4 flex-shrink-0">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer flex items-center justify-center transition-colors overflow-hidden"
                  >
                    {uploadedImage ? (
                      <Image
                        src={URL.createObjectURL(uploadedImage)}
                        alt="上传的图片"
                        className="w-full h-full object-cover"
                        width={128}
                        height={128}
                      />
                    ) : (
                      <div className="text-center text-gray-500 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        点击上传图片
                      </div>
                    )}
                  </label>
                </div>
              )}

              {/* 文本输入框 */}
              <div className={`${mode === "img2img" ? "flex-grow" : "w-full"}`}>
                <textarea
                  id="prompt"
                  className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-500 rounded-lg text-black dark:text-black outline-none"
                  style={{ backgroundColor: "rgba(227, 218, 173, 0.8)" }}
                  placeholder={mode === "text2img"
                    ? "例如：一个小女孩在森林中与小精灵一起玩耍，阳光透过树叶洒落"
                    : "描述如何修改上传的图片，例如：戴上眼镜；不填写默认转换成吉卜力风格"}
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />

                {/* 图片尺寸选择器 - 仅在文生图模式下显示 */}
                {mode === "text2img" && (
                  <div className="mt-2">
                    <select
                      id="image-size"
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="px-3 py-2 border border-gray-500 text-gray-500 justify-center items-center rounded-md text-sm outline-none"
                      style={{ backgroundColor: "rgba(227, 218, 173, 0.8)" }}
                    >
                      {imageSizeOptions.map((option) => (
                        <option key={option.id} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="max-w-3xl mx-auto flex justify-end gap-3 mt-4">
            <button
              onClick={() => {
                setPrompt("");
                setImageUrl("");
                setError("");
                setUploadedImage(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              重置
            </button>
            <button
              onClick={generateImage}
              disabled={isLoading}
              className="px-4 py-2 bg-black hover:bg-black/80 text-white font-medium rounded-lg shadow transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  生成中...
                </span>
              ) : (
                mode === "text2img" ? "生成图像" : "转换图像"
              )}
            </button>
          </div>

          {error && (
            <div className="max-w-3xl mx-auto bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 mt-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {imageUrl && (
            <div className="max-w-3xl mx-auto text-center dark:bg-opacity-60 rounded-xl shadow-lg p-6 mb-8 mt-8" style={{ backgroundColor: "rgba(227, 218, 173, 0.8)" }}>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-gray-600 mb-4">生成的图像</h2>
              <div className="relative w-full max-w-2xl mx-auto rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="生成的吉卜力风格图像"
                  className="w-full h-auto"
                  width={1024}
                  height={1024}
                  style={{ width: '100%', height: 'auto' }}
                  unoptimized
                />
              </div>
              <div className="mt-4 text-center">
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 hover:text-amber-800 dark:text-amber-600 dark:hover:text-amber-600 underline"
                >
                  保存图片
                </a>
              </div>
            </div>
          )}

          <footer className="text-center text-white text-opacity-70 mt-12 relative">
            <div>© 2025 GhibliX. 如有疑问请
              <span
                ref={contactRef}
                className="ml-1 cursor-pointer hover:text-white hover:underline"
                onMouseEnter={() => setShowQRCode(true)}
                onMouseLeave={() => setShowQRCode(false)}
              >
                [联系我]
              </span>
            </div>

            {/* 将tooltip移到p标签外部，避免嵌套问题 */}
            {showQRCode && contactRef.current && (
              <div
                className="absolute bg-white p-3 rounded-lg shadow-lg z-50"
                style={{
                  left: '50%',
                  bottom: '100%',
                  transform: 'translateX(-50%)',
                  marginBottom: '10px'
                }}
              >
                <Image
                  src="/images/qrcode.png"
                  alt="联系二维码"
                  width={150}
                  height={150}
                  className="rounded"
                />
                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-4 h-4 bg-white"></div>
              </div>
            )}
          </footer>

        </div>
        {/* 向下箭头指示器 */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center">
          <button
            onClick={() => scrollToPage(1)}
            className="animate-bounce bg-white/20 p-2 w-10 h-10 ring-1 ring-white/20 shadow-lg rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="向下滚动"
          >
            <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* 第二页 */}
      <div className="page-second bg-black min-h-screen flex items-center justify-center relative snap-start">
        <div className="container mx-auto px-4 py-12 relative z-10 text-white">
          <div className="max-w-4xl mx-auto">
            <ShowCases ossHost={ossHost} />
          </div>
        </div>

        {/* 向上箭头指示器 */}
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <button
            onClick={() => scrollToPage(0)}
            className="bg-white/20 p-2 w-10 h-10 ring-1 ring-white/20 shadow-lg rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label="向上滚动"
          >
            <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}

