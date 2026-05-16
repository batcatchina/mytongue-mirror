/**
 * 支付弹窗组件
 * 支持支付宝支付（PC端表单提交 / 移动端WAP跳转）
 */

import React, { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  price?: number;
}

/**
 * 检测是否为移动端设备
 */
const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Mobile|mobile/i.test(ua) ||
         /MicroMessenger|WeChat/i.test(ua);
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  price = 9.9,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // 调用支付宝支付接口
  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // 设置15秒超时，支付宝沙箱网关响应慢
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        var response = await fetch('/api/alipay/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: '解锁完整辨证报告',
            total_amount: price.toString(),
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      if (!data.success) {
        setIsProcessing(false);
        alert(data.error || '发起支付失败，请重试');
        return;
      }

      // 移动端：跳转 WAP 支付页面
      if (isMobileDevice()) {
        const payUrl = data.payUrl || data.formHtml;
        if (payUrl) {
          window.location.href = payUrl;
        } else {
          setIsProcessing(false);
          alert('支付链接生成失败，请重试');
        }
      } else {
        // PC 端：渲染支付表单并自动提交
        if (data.formHtml) {
          const container = document.createElement('div');
          container.innerHTML = data.formHtml;
          document.body.appendChild(container);

          const form = container.querySelector('form');
          if (form) {
            // 创建隐藏的 return_url 字段带回支付状态
            const returnInput = document.createElement('input');
            returnInput.type = 'hidden';
            returnInput.name = 'return_url';
            returnInput.value = window.location.href;
            form.appendChild(returnInput);

            form.style.display = 'none';
            form.submit();
          } else {
            setIsProcessing(false);
            alert('支付表单生成异常，请重试');
          }
        } else {
          setIsProcessing(false);
          alert('支付表单生成失败，请重试');
        }
      }
    } catch (error) {
      console.error('支付请求失败:', error);
      setIsProcessing(false);
      if (error instanceof DOMException && error.name === 'AbortError') {
        alert('支付请求超时，支付宝沙箱响应较慢，请稍后重试');
      } else {
        alert('网络错误，请检查网络后重试');
      }
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
                🔓
              </div>
              <div>
                <h3 className="font-semibold">解锁完整辨证报告</h3>
                <p className="text-sm text-white/80">一次付费，永久查看</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 价格展示 */}
        <div className="p-4 bg-stone-50 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">支付金额</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-emerald-600">¥{price}</span>
                <span className="text-sm text-stone-400 line-through">¥29.9</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                限时优惠
              </p>
            </div>
          </div>
        </div>

        {/* 支付方式 - 仅保留支付宝 */}
        <div className="p-4 space-y-4">
          <p className="text-sm font-medium text-stone-700">支付方式</p>

          {/* 支付宝（静态选中态） */}
          <div className="w-full p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#1677FF] flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.422 15.358c-3.22-1.386-6.847-2.204-10.718-2.204-.317 0-.633.01-.949.02l-.001.001c-.475.014-.95.03-1.425.05l-.268.003c-.821.036-1.639.084-2.453.144l-.29.02c-.754.068-1.5.15-2.27.262-.082.014-.164.027-.246.04-.484.085-.97.175-1.453.273l-.027.006c-.38.082-.756.166-1.137.262l-.054.011c-.478.123-.95.254-1.419.392l-.066.02c-.412.13-.82.266-1.223.407l-.048.017c-.541.191-1.069.398-1.588.618l-.046.019c-.363.162-.72.33-1.067.506l-.068.037c-.391.223-.768.456-1.134.698l-.038.028c-.323.244-.631.498-.926.762l-.045.042c-.327.314-.626.644-.904.987l-.016.02c-.287.377-.55.767-.79 1.172l-.025.041c-.213.379-.408.768-.581 1.167l-.021.054c-.212.539-.387 1.093-.524 1.657l-.012.056c-.108.476-.187.958-.238 1.445l-.004.033c-.041.403-.059.81-.059 1.219 0 .125.008.248.025.37.015.114.03.227.052.34l.006.026c.088.502.213.996.374 1.479l.017.05c.123.351.26.697.416 1.036l.023.049c.196.401.414.792.654 1.17l.014.021c.233.349.483.687.746 1.014.031.039.063.078.095.117.263.311.54.613.834.907.087.087.175.173.264.258l.011.011c.335.318.687.624 1.054.914.025.019.049.038.074.057.378.285.77.555 1.175.808.017.011.035.022.053.033.355.218.719.421 1.091.608.007.004.014.007.021.011.418.204.846.391 1.28.56.018.007.036.015.054.022.477.182.964.344 1.458.486.012.004.024.008.036.012.468.124.943.232 1.424.32.029.005.058.011.087.016.475.078.957.141 1.44.187.013.001.025.003.038.004.537.04 1.079.062 1.622.062.566 0 1.13-.024 1.689-.072l.105-.009c.447-.043.89-.098 1.331-.165.038-.006.076-.011.113-.017.438-.075.87-.163 1.298-.262.02-.004.04-.009.06-.014.43-.108.855-.228 1.276-.36.016-.005.032-.01.047-.015.415-.141.824-.296 1.227-.462.008-.003.016-.006.024-.009.4-.173.792-.36 1.175-.56.015-.008.03-.016.046-.024.379-.208.748-.43 1.107-.667.005-.003.01-.006.015-.009.347-.239.684-.492 1.006-.758.033-.026.066-.053.098-.08.307-.267.604-.546.887-.838.018-.019.036-.037.053-.056.274-.299.532-.61.773-.936.011-.014.021-.028.032-.042.275-.397.525-.807.749-1.233.006-.011.012-.022.019-.033.216-.433.405-.881.567-1.342.003-.008.006-.016.008-.024.178-.536.319-1.087.422-1.649.004-.023.008-.045.012-.068.099-.626.153-1.263.162-1.902v-.066c-.009-.638-.063-1.275-.162-1.901-.004-.023-.008-.045-.012-.068-.103-.562-.244-1.113-.422-1.649-.002-.008-.005-.016-.008-.024-.162-.461-.351-.909-.567-1.342-.006-.011-.012-.022-.019-.033-.224-.426-.474-.836-.749-1.233-.011-.014-.021-.028-.032-.042-.241-.326-.499-.637-.773-.936-.017-.019-.035-.037-.053-.056-.283-.292-.58-.571-.887-.838-.032-.027-.065-.054-.098-.08-.322-.266-.659-.519-1.006-.758-.005-.003-.01-.006-.015-.009-.359-.237-.728-.459-1.107-.667-.015-.008-.03-.016-.046-.024-.383-.2-.775-.387-1.175-.56-.008-.003-.016-.007-.024-.01-.403-.167-.813-.322-1.228-.463l-.047-.015c-.421-.132-.846-.252-1.276-.36-.02-.005-.04-.01-.06-.014-.428-.099-.86-.187-1.298-.262-.037-.006-.075-.011-.113-.017-.441-.067-.884-.122-1.331-.165l-.105-.009c-.559-.048-1.123-.072-1.689-.072-.543 0-1.085.022-1.622.062-.013.001-.025.003-.038.004-.483.046-.965.109-1.44.187-.029.005-.058.011-.087.016-.481.088-.956.196-1.424.32-.012.004-.024.008-.036.012-.494.142-.981.304-1.458.486-.018.007-.036.015-.054.022-.434.169-.862.356-1.28.56-.007.004-.014.007-.021.011-.372.187-.736.39-1.091.608-.018.011-.036.022-.053.033-.405.253-.797.523-1.175.808-.025.019-.049.038-.074.057-.367.29-.719.596-1.054.914l-.011.011c-.089.085-.177.171-.264.258-.294.294-.571.596-.834.907-.032.039-.064.078-.095.117-.263.327-.513.665-.746 1.014l-.014.021c-.24.378-.458.769-.654 1.17l-.023.049c-.156.339-.293.685-.416 1.036l-.017.05c-.161.483-.286.977-.374 1.479l-.006.026c-.022.113-.037.226-.052.34-.017.122-.025.245-.025.37 0 .409.018.816.059 1.219l.004.033c.051.487.13.969.238 1.445l.012.056c.137.564.312 1.118.524 1.657l.021.054c.173.399.368.788.581 1.167l.025.041c.24.405.503.795.79 1.172l.016.02c.278.343.577.673.904.987l.045.042c.295.264.603.518.926.762l.038.028c.366.242.743.475 1.134.698l.068.037c.347.176.704.344 1.067.506l.046.019c.519.22 1.047.427 1.588.618l.048.017c.403.141.811.277 1.223.407l.066.02c.469.138.941.269 1.419.392l.054.011c.381.096.757.18 1.137.262l.027.006c.483.098.969.188 1.453.273.082.013.164.026.246.04.77.112 1.516.194 2.27.262l.29.02c.814.06 1.632.108 2.453.144l.268-.003c.475-.02.95-.036 1.425-.05l.001-.001c.316-.01.632-.02.949-.02 3.871 0 7.498.818 10.718 2.204.48.205.968.431 1.462.676.278.136.543.272.777.405.549.31 1.063.629 1.535.953.162.114.308.217.437.313.04-.903.027-1.815-.037-2.718-.096-1.297-.374-2.519-.801-3.623z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-700">支付宝支付</p>
              <p className="text-xs text-stone-500">推荐使用支付宝扫码支付</p>
            </div>
            <div className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* 确认支付按钮 */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                跳转支付...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                确认支付 ¥{price}
              </>
            )}
          </button>

          {/* 注意事项 */}
          <p className="text-xs text-stone-400 text-center">
            点击支付即表示您同意《用户服务协议》
          </p>
        </div>

        {/* 底部保障 */}
        <div className="p-3 bg-stone-50 border-t border-stone-100">
          <div className="flex items-center justify-center gap-4 text-xs text-stone-400">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>安全支付</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>7×24h服务</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
