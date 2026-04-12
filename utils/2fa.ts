// 获取当前的 30 秒时间步长计数
export function getCurrentStep() {
  const timeStep = 30; // 步长 30 秒
  return Math.floor(Date.now() / 1000 / timeStep);
}

// 生成/校验 TOTP 的完整代码
export async function generateTOTP(secret: any, windowStep: any) {
  // 1. 将密钥和时间步长转换为 Buffer
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msg = new Uint8Array(8);
  let step = windowStep;

  // 将步长转为 8 字节大端序
  for (let i = 7; i >= 0; i--) {
    msg[i] = step & 0xff;
    step >>= 8;
  }

  // 2. 使用 HMAC-SHA1 加密 (Web Crypto API)
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msg);
  const hmac = new Uint8Array(signature);

  // 3. 动态截断 (Dynamic Truncation)
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000; // 取 6 位数字

  return code.toString().padStart(6, '0');
}

export async function verifyTFA(userInput: any, secret: any) {
  const currentStep = getCurrentStep();

  // 检查当前步长、上一个步长、下一个步长（允许 30-60 秒误差）
  const stepsToCheck = [currentStep, currentStep - 1, currentStep + 1];

  for (const step of stepsToCheck) {
    const validCode = await generateTOTP(secret, step);
    if (userInput === validCode) {
      return true; // 校验成功
    }
  }

  return false; // 校验失败
}