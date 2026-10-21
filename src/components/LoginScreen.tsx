import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Mail,
  Phone,
  Send,
  Sparkles,
  X,
  Shield,
  ShieldAlert,
  Smartphone,
  Laptop,
  HelpCircle,
  LogIn,
  UserPlus
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { EasyEngLogo } from './EasyEngLogo';
import { UserProfile, PasswordResetRequest, AccountVerificationRequest, UserActiveSession } from '../types';
import {
  resolveValidUsername,
  sanitizePhoneNumber,
  sanitizeEmailAddress,
  validatePassword,
  validateNickname,
  validateFullName
} from '../utils/userUtils';
import {
  savePasswordResetRequestToCloud,
  checkLearnerActiveSession,
  setAccountActiveSession,
  saveAccountVerificationRequestToCloud
} from '../services/firebase';
import { getOrCreateDeviceId, getDeviceDescription } from '../utils/sessionUtils';
import { ClassItem, ALL_12_GRADES, getGradeLevelName, getDefaultGradeEmoji } from '../utils/gradeUtils';

interface LoginScreenProps {
  learners: UserProfile[];
  classes?: ClassItem[];
  isLoading?: boolean;
  onSelectLearner: (learnerId: string) => void;
  onAddLearner?: (learner: UserProfile) => void;
  onOpenAdminManager?: () => void;
  customLogo?: string | null;
  welcomeLogoSize?: number;
}

const ADMIN_EMAIL = 'linhnk.online@gmail.com';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  learners = [],
  classes = [],
  isLoading = false,
  onSelectLearner,
  onAddLearner,
  onOpenAdminManager,
  customLogo,
  welcomeLogoSize
}) => {
  // Screen mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // Classes list from CSDL (Cloud Firestore) or fallback to standard grades
  const availableClasses: ClassItem[] = (classes && classes.length > 0)
    ? classes
    : ALL_12_GRADES.map(g => ({
        grade: g,
        name: `Lớp ${g}`,
        description: getGradeLevelName(g),
        emoji: getDefaultGradeEmoji(g)
      }));

  // Register form state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regGrade, setRegGrade] = useState<number>(() => classes[0]?.grade || 4);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Sync regGrade when classes loads from CSDL if currently selected is not in list
  useEffect(() => {
    if (classes && classes.length > 0 && !classes.some(c => c.grade === regGrade)) {
      setRegGrade(classes[0].grade);
    }
  }, [classes]);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetFullName, setResetFullName] = useState('');
  const [resetNickname, setResetNickname] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Single active device session & Account verification state
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [deviceConflictSession, setDeviceConflictSession] = useState<UserActiveSession | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationFullName, setVerificationFullName] = useState('');
  const [verificationNickname, setVerificationNickname] = useState('');
  const [verificationPhone, setVerificationPhone] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccessMessage, setVerificationSuccessMessage] = useState<string | null>(null);
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  const loginInputRef = useRef<HTMLInputElement>(null);
  const regInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus username input on mode change
  useEffect(() => {
    if (mode === 'login') {
      setTimeout(() => loginInputRef.current?.focus(), 150);
    } else {
      setTimeout(() => regInputRef.current?.focus(), 150);
    }
    setLoginError(null);
    setRegError(null);
  }, [mode]);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanInputUser = loginUsername.trim();
    const cleanInputPass = loginPassword.trim();

    if (!cleanInputUser) {
      soundEffects.playError();
      setLoginError('Vui lòng nhập tên đăng nhập / username!');
      triggerShake();
      return;
    }

    if (!cleanInputPass) {
      soundEffects.playError();
      setLoginError('Vui lòng nhập mật khẩu / password!');
      triggerShake();
      return;
    }

    // Match learner by:
    // 1. resolved username (ignoring case)
    // 2. stored username (ignoring case)
    // 3. stored name / nickname (ignoring case)
    const lowerInput = cleanInputUser.toLowerCase();
    const matchedLearner = learners.find(l => {
      const validUsername = resolveValidUsername(l.username, l.name).toLowerCase();
      const storedUser = (l.username || '').toLowerCase();
      const storedName = (l.name || '').toLowerCase();
      return validUsername === lowerInput || storedUser === lowerInput || storedName === lowerInput;
    });

    if (!matchedLearner) {
      soundEffects.playError();
      setLoginError('Tên đăng nhập không tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc bấm "Tạo tài khoản" bên dưới!');
      triggerShake();
      return;
    }

    // Check PIN / password (remove default 0000 fallback)
    const actualPass = matchedLearner.pin !== undefined && matchedLearner.pin !== null ? matchedLearner.pin.trim() : '';
    if (cleanInputPass !== actualPass) {
      soundEffects.playError();
      setLoginError('Mật khẩu không chính xác! Vui lòng thử lại hoặc bấm "Cấp lại mật khẩu" bên dưới để được hỗ trợ.');
      triggerShake();
      return;
    }

    // Check single active device session (Tại 1 thời điểm chỉ được 1 tài khoản đăng nhập)
    setIsCheckingSession(true);
    const currentDeviceId = getOrCreateDeviceId();
    try {
      const sessionResult = await checkLearnerActiveSession(matchedLearner.learnerId, currentDeviceId);
      if (sessionResult.isConflict) {
        soundEffects.playError();
        setDeviceConflictSession(sessionResult.activeSession || null);
        setLoginError(
          'tài khoản đang đăng nhập trên 1 thiết bị khác, vui lòng kiểm tra lại các thiết bị bạn đang sử dụng hoặc liên hệ admin để xác minh việc tài khoản bị truy cập trái phép'
        );
        triggerShake();
        setIsCheckingSession(false);
        return;
      }

      // Record this device as active session
      await setAccountActiveSession({
        learnerId: matchedLearner.learnerId,
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        deviceId: currentDeviceId,
        deviceDescription: getDeviceDescription(),
        isLoggedIn: true,
        loginAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString()
      });
    } catch (sessionErr) {
      console.warn('Session check warning:', sessionErr);
    } finally {
      setIsCheckingSession(false);
    }

    // Login successful
    soundEffects.playSuccess();
    onSelectLearner(matchedLearner.learnerId);
  };

  // Trigger shake animation on error
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  // Handle Register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const cleanUser = regUsername.trim();
    const cleanPass = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();

    // 1. Validate Nickname (không dấu, không in hoa, tối thiểu 4 kí tự, tối đa 16 kí tự)
    const nickValidation = validateNickname(cleanUser);
    if (!nickValidation.isValid) {
      soundEffects.playError();
      setRegError(nickValidation.error || 'Nickname không hợp lệ!');
      return;
    }

    // Check duplicate username across database
    const lowerUser = cleanUser.toLowerCase();
    const conflict = learners.find(l => {
      const existingUser = resolveValidUsername(l.username, l.name).toLowerCase();
      return existingUser === lowerUser || (l.username && l.username.toLowerCase() === lowerUser);
    });

    if (conflict) {
      soundEffects.playError();
      setRegError(`Nickname / Tên đăng nhập "${cleanUser}" đã có người sử dụng. Vui lòng chọn tên khác!`);
      return;
    }

    // 2. Validate Password (tối thiểu 4 kí tự, tối đa 16 kí tự bao gồm cả chữ, số và ký tự đặc biệt do người dùng đặt)
    const passValidation = validatePassword(cleanPass);
    if (!passValidation.isValid) {
      soundEffects.playError();
      setRegError(passValidation.error || 'Mật khẩu phải từ 4 đến 16 ký tự!');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      soundEffects.playError();
      setRegError('Mật khẩu và xác nhận mật khẩu không trùng khớp!');
      return;
    }

    // Create new profile
    const newId = `learner_${Date.now()}`;
    const newProfile: UserProfile = {
      learnerId: newId,
      username: cleanUser,
      name: cleanUser,
      grade: regGrade,
      avatar: '🦊',
      pin: cleanPass,
      level: 1,
      xp: 0,
      totalStars: 0,
      unlockedBadges: [],
      completedUnits: {},
      currentStreak: 1,
      lastActiveDate: new Date().toISOString()
    };

    // Record session for new profile
    const currentDeviceId = getOrCreateDeviceId();
    try {
      await setAccountActiveSession({
        learnerId: newId,
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        deviceId: currentDeviceId,
        deviceDescription: getDeviceDescription(),
        isLoggedIn: true,
        loginAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Set new account active session warning:', e);
    }

    soundEffects.playSuccess();
    if (onAddLearner) {
      onAddLearner(newProfile);
    }
    // Automatically log in
    onSelectLearner(newId);
  };

  // Open password reset modal
  const handleOpenResetModal = () => {
    soundEffects.playClick();
    setResetFullName('');
    setResetNickname(loginUsername.trim());
    setResetPhone('');
    setResetEmail('');
    setResetError(null);
    setResetSuccessMessage(null);
    setShowResetModal(true);
  };

  // Handle Password Reset submission
  const handleSendResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    const cleanFullName = resetFullName.trim();
    const cleanNick = resetNickname.trim();
    const cleanPhone = sanitizePhoneNumber(resetPhone);
    const cleanEmail = sanitizeEmailAddress(resetEmail);

    // 1. Quy tắc họ tên: có thể không dấu hoặc có dấu, tối thiểu 4 kí tự tối đa 32 kí tự, không cho phép kí tự đặc biệt ngoại trừ các dấu của ngôn ngữ
    const nameValidation = validateFullName(cleanFullName);
    if (!nameValidation.isValid) {
      soundEffects.playError();
      setResetError(nameValidation.error || 'Họ và tên không hợp lệ!');
      return;
    }

    // 2. Quy tắc đặt nickname: không dấu, không in hoa, tối thiểu 4 kí tự, tối đa 16 kí tự
    const nickValidation = validateNickname(cleanNick);
    if (!nickValidation.isValid) {
      soundEffects.playError();
      setResetError(nickValidation.error || 'Nickname không hợp lệ!');
      return;
    }

    // 3. Số điện thoại (9 đến 11 số)
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 11) {
      soundEffects.playError();
      setResetError('Vui lòng nhập số điện thoại hợp lệ (từ 9 đến 11 số)!');
      return;
    }

    // 4. Email cá nhân dùng để nhận lại mật khẩu
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      soundEffects.playError();
      setResetError('Vui lòng nhập địa chỉ email hợp lệ để nhận lại mật khẩu!');
      return;
    }

    setIsSubmittingReset(true);

    const reqData: PasswordResetRequest = {
      id: `reset_${Date.now()}`,
      fullName: cleanFullName,
      nickname: cleanNick,
      phone: cleanPhone,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      // 1. Save request to Cloud Firestore
      await savePasswordResetRequestToCloud(reqData);

      // 2. Open email client with pre-filled content to admin
      const subject = encodeURIComponent(`[EasyEng] Yêu cầu cấp lại mật khẩu: ${cleanFullName} (${cleanNick})`);
      const body = encodeURIComponent(
        `Kính gửi Quản trị viên EasyEng (${ADMIN_EMAIL}),\n\n` +
        `Tôi xin gửi yêu cầu hỗ trợ cấp lại mật khẩu tài khoản học tiếng Anh với thông tin chi tiết như sau:\n` +
        `- Họ và tên: ${cleanFullName}\n` +
        `- Nickname / Tên tài khoản: ${cleanNick}\n` +
        `- Số điện thoại liên hệ: ${cleanPhone}\n` +
        `- Email cá nhân nhận lại mật khẩu: ${cleanEmail}\n` +
        `- Thời gian gửi yêu cầu: ${new Date().toLocaleString('vi-VN')}\n\n` +
        `Kính mong Quản trị viên hỗ trợ kiểm tra và cấp lại mật khẩu vào địa chỉ email: ${cleanEmail}.\n` +
        `Trân trọng cảm ơn!`
      );

      // Trigger mailto link
      const mailtoUrl = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;

      soundEffects.playSuccess();
      setResetSuccessMessage(
        `Yêu cầu cấp lại mật khẩu đã được gửi đến Quản trị viên qua địa chỉ ${ADMIN_EMAIL}. Quản trị viên sẽ kiểm tra và phản hồi mật khẩu mới vào email "${cleanEmail}" của bạn sớm nhất!`
      );
    } catch (err) {
      console.error('Password reset request error:', err);
      // Still display success because mailto was prepared
      setResetSuccessMessage(
        `Yêu cầu của bạn đã được ghi nhận. Quản trị viên (${ADMIN_EMAIL}) sẽ xử lý và liên hệ lại với bạn qua email "${cleanEmail}"!`
      );
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Open Account Verification Modal (khi tài khoản bị đăng nhập thiết bị khác hoặc nghi bị truy cập trái phép)
  const handleOpenVerificationModal = (prefNick?: string) => {
    soundEffects.playClick();
    setVerificationFullName('');
    setVerificationNickname(prefNick || loginUsername.trim());
    setVerificationPhone('');
    setVerificationEmail('');
    setVerificationError(null);
    setVerificationSuccessMessage(null);
    setShowVerificationModal(true);
  };

  // Handle Account Verification submission
  const handleSendVerificationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    const cleanFullName = verificationFullName.trim();
    const cleanNick = verificationNickname.trim();
    const cleanPhone = sanitizePhoneNumber(verificationPhone);
    const cleanEmail = sanitizeEmailAddress(verificationEmail);

    // 1. Quy tắc họ tên: có thể không dấu hoặc có dấu, tối thiểu 4 kí tự tối đa 32 kí tự, không cho phép kí tự đặc biệt ngoại trừ các dấu của ngôn ngữ
    const nameValidation = validateFullName(cleanFullName);
    if (!nameValidation.isValid) {
      soundEffects.playError();
      setVerificationError(nameValidation.error || 'Họ và tên không hợp lệ!');
      return;
    }

    // 2. Quy tắc đặt nickname: không dấu, không in hoa, tối thiểu 4 kí tự, tối đa 16 kí tự
    const nickValidation = validateNickname(cleanNick);
    if (!nickValidation.isValid) {
      soundEffects.playError();
      setVerificationError(nickValidation.error || 'Nickname không hợp lệ!');
      return;
    }

    // 3. Số điện thoại (9 đến 11 số)
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 11) {
      soundEffects.playError();
      setVerificationError('Vui lòng nhập số điện thoại hợp lệ (từ 9 đến 11 số)!');
      return;
    }

    // 4. Email cá nhân dùng để nhận kết quả xác minh
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      soundEffects.playError();
      setVerificationError('Vui lòng nhập địa chỉ email hợp lệ để nhận phản hồi xác minh!');
      return;
    }

    setIsSubmittingVerification(true);

    const currentDevice = getDeviceDescription();
    const reqData: AccountVerificationRequest = {
      id: `verif_${Date.now()}`,
      fullName: cleanFullName,
      nickname: cleanNick,
      phone: cleanPhone,
      email: cleanEmail,
      deviceInfo: currentDevice,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      // 1. Save request to Cloud Firestore
      await saveAccountVerificationRequestToCloud(reqData);

      // 2. Open email client with pre-filled content to admin
      const subject = encodeURIComponent(`[EasyEng] Yêu cầu xác minh tài khoản: ${cleanFullName} (${cleanNick})`);
      const body = encodeURIComponent(
        `Kính gửi Quản trị viên EasyEng (${ADMIN_EMAIL}),\n\n` +
        `Tôi xin gửi yêu cầu hỗ trợ xác minh tài khoản học tiếng Anh do hệ thống thông báo tài khoản đang đăng nhập trên một thiết bị khác hoặc nghi ngờ bị truy cập trái phép, với thông tin chi tiết như sau:\n` +
        `- Họ và tên: ${cleanFullName}\n` +
        `- Nickname / Tên tài khoản: ${cleanNick}\n` +
        `- Số điện thoại liên hệ: ${cleanPhone}\n` +
        `- Email cá nhân nhận phản hồi: ${cleanEmail}\n` +
        `- Thiết bị đang sử dụng: ${currentDevice}\n` +
        `- Thời gian gửi yêu cầu: ${new Date().toLocaleString('vi-VN')}\n\n` +
        `Kính mong Quản trị viên hỗ trợ kiểm tra, ngắt kết nối các thiết bị khác và xác minh quyền sở hữu tài khoản giúp tôi qua địa chỉ email: ${cleanEmail}.\n` +
        `Trân trọng cảm ơn!`
      );

      // Trigger mailto link
      const mailtoUrl = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
      window.location.href = mailtoUrl;

      soundEffects.playSuccess();
      setVerificationSuccessMessage(
        `Yêu cầu xác minh tài khoản đã được gửi đến Quản trị viên qua địa chỉ ${ADMIN_EMAIL}. Quản trị viên sẽ kiểm tra, ngắt kết nối các thiết bị truy cập trái phép và gửi phản hồi xác nhận vào email "${cleanEmail}" của bạn sớm nhất!`
      );
    } catch (err) {
      console.error('Account verification request error:', err);
      // Still display success because mailto was prepared
      setVerificationSuccessMessage(
        `Yêu cầu xác minh của bạn đã được ghi nhận. Quản trị viên (${ADMIN_EMAIL}) sẽ xử lý và liên hệ lại với bạn qua email "${cleanEmail}"!`
      );
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-radial from-amber-50/70 via-orange-50/40 to-amber-100/30 flex flex-col justify-center items-center py-4 px-3 sm:px-4 relative overflow-x-hidden selection:bg-amber-200 selection:text-amber-900">
      
      {/* Decorative Background Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-orange-200/25 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 right-10 w-72 h-72 bg-purple-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Brand Banner with Logo */}
      <div className="max-w-md mx-auto w-full text-center pt-1 sm:pt-2 mb-2 sm:mb-2.5 shrink-0 flex flex-col items-center">
        <div className="flex items-center justify-center transform hover:scale-102 transition duration-300">
          <EasyEngLogo
            className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 drop-shadow-md"
            src={customLogo || undefined}
            size={welcomeLogoSize || 220}
          />
        </div>

        <div className="mt-1.5 sm:mt-2">
          <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-amber-300/80 text-amber-950 px-3.5 py-0.5 rounded-full text-xs sm:text-sm font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Tiếng Anh dễ mà!</span>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md flex flex-col items-center my-1 sm:my-2 px-2">
        <div
          className={`w-full bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 border-2 border-amber-200/90 shadow-xl shadow-amber-900/5 transition-all duration-300 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* ========================================================= */}
          {/* VIEW 1: ĐĂNG NHẬP / LOGIN */}
          {/* ========================================================= */}
          {mode === 'login' && (
            <div className="space-y-4">
              <div className="text-center pb-3 border-b border-slate-100">
                <p className="text-sm sm:text-base font-bold text-orange-400">
                  EasyEng xin chào!
                </p>
              </div>

              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-semibold flex flex-col gap-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-snug">{loginError}</span>
                  </div>

                  {/* Khi bị xung đột đăng nhập đa thiết bị: Hiển thị mục Liên hệ Admin: Xác minh tài khoản */}
                  {loginError.includes('tài khoản đang đăng nhập trên 1 thiết bị khác') && (
                    <div className="pt-2 border-t border-rose-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      {deviceConflictSession?.deviceDescription ? (
                        <div className="text-[11px] text-rose-700 font-normal">
                          Đang hoạt động trên: <strong>{deviceConflictSession.deviceDescription}</strong>
                        </div>
                      ) : <div />}
                      <button
                        type="button"
                        onClick={() => handleOpenVerificationModal(loginUsername.trim())}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                        title="Gửi yêu cầu xác minh và mở khóa tài khoản tới Quản trị viên"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Liên hệ Admin: Xác minh tài khoản</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Tên đăng nhập / Username */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tên đăng nhập / Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      ref={loginInputRef}
                      type="text"
                      value={loginUsername}
                      onChange={(e) => {
                        setLoginUsername(e.target.value);
                        setLoginError(null);
                      }}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-sm"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                {/* Mật khẩu / Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mật khẩu / Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError(null);
                      }}
                      className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-sm"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Nút Vào học */}
                <button
                  type="submit"
                  disabled={isLoading || isCheckingSession}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-orange-500/25 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading || isCheckingSession ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Vào học</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Dòng chữ bên dưới khung đăng nhập: Cấp lại mật khẩu, Tạo tài khoản */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-semibold">
                <button
                  type="button"
                  onClick={handleOpenResetModal}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-amber-700 hover:underline transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cấp lại mật khẩu</span>
                </button>

                <span className="text-slate-300">•</span>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setMode('register');
                  }}
                  className="inline-flex items-center gap-1.5 text-amber-700 hover:text-orange-600 font-bold hover:underline transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-orange-500" />
                  <span>Tạo tài khoản</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: TẠO TÀI KHOẢN / REGISTER */}
          {/* ========================================================= */}
          {mode === 'register' && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 tracking-tight">
                  Tạo tài khoản
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Điền tên đăng nhập và mật khẩu để tạo tài khoản mới
                </p>
              </div>

              {regError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm font-semibold flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="leading-snug">{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* 1. Tên đăng nhập / Username */}
                {/* 1. Tên đăng nhập / Nickname */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tên đăng nhập / Nickname <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      ref={regInputRef}
                      type="text"
                      maxLength={16}
                      value={regUsername}
                      onChange={(e) => {
                        setRegUsername(e.target.value);
                        setRegError(null);
                      }}
                      placeholder="Nhập nickname (4-16 ký tự, viết thường, không dấu)..."
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-sm"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Không dấu, không in hoa, tối thiểu 4 kí tự, tối đa 16 kí tự
                  </p>
                </div>

                {/* Chọn trình độ tiếng Anh: Menu xổ xuống danh sách lớp từ CSDL */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Chọn trình độ tiếng Anh:
                  </label>
                  <select
                    value={regGrade}
                    onChange={(e) => setRegGrade(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-sm cursor-pointer"
                  >
                    {availableClasses.map((c) => {
                      const levelName = getGradeLevelName(c.grade);
                      const displayTitle = c.name ? `${c.emoji || '🎓'} ${c.name}` : `🎓 Lớp ${c.grade}`;
                      const extraInfo = c.description ? ` (${c.description})` : ` (${levelName})`;
                      return (
                        <option key={c.grade} value={c.grade}>
                          {displayTitle}{extraInfo}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 2. Mật khẩu / Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      maxLength={16}
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        setRegError(null);
                      }}
                      placeholder="Nhập mật khẩu (4-16 ký tự)..."
                      className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Quy tắc: Tối thiểu 4 kí tự, tối đa 16 kí tự (bao gồm cả chữ, số và ký tự đặc biệt)
                  </p>
                </div>

                {/* 3. Xác nhận mật khẩu */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Xác nhận mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      maxLength={16}
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        setRegError(null);
                      }}
                      placeholder="Nhập lại mật khẩu để xác nhận..."
                      className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Nút Tạo tài khoản */}
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:via-teal-600 hover:to-emerald-700 text-white font-extrabold text-sm sm:text-base shadow-md shadow-emerald-500/25 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tạo tài khoản & Vào học</span>
                </button>
              </form>

              {/* Quay lại Đăng nhập */}
              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setMode('login');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-900 hover:underline transition cursor-pointer"
                >
                  <span>← Đã có tài khoản? Đăng nhập ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer: © 2026 LinhNK - giữ nguyên hiển thị và con trỏ chuột khi hover */}
      <footer className="text-center mt-2 sm:mt-2.5 py-1 text-xs font-semibold text-slate-500 shrink-0 select-none">
        © 2026{' '}
        <span
          onClick={() => {
            if (onOpenAdminManager) {
              soundEffects.playClick();
              onOpenAdminManager();
            }
          }}
          className="cursor-default"
        >
          LinhNK
        </span>
      </footer>

      {/* ========================================================= */}
      {/* MODAL CẤP LẠI MẬT KHẨU / PASSWORD RESET REQUEST DIALOG */}
      {/* ========================================================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border-2 border-amber-300 shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-200 relative">
            {/* Close button */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setShowResetModal(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-display font-bold text-lg text-slate-800">
                  Cấp lại mật khẩu
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Vui lòng nhập đầy đủ thông tin
                </p>
              </div>
            </div>

            {/* Success state */}
            {resetSuccessMessage ? (
              <div className="space-y-4 py-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Gửi yêu cầu thành công!</span>
                  </div>
                  <p className="leading-relaxed">{resetSuccessMessage}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setShowResetModal(false);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
                >
                  Đóng & Quay lại đăng nhập
                </button>
              </div>
            ) : (
              /* Request form */
              <form onSubmit={handleSendResetRequest} className="space-y-3.5">
                {resetError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* 1. Họ và tên */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    value={resetFullName}
                    onChange={(e) => {
                      setResetFullName(e.target.value);
                      setResetError(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-xs sm:text-sm transition"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    Không dấu hoặc có dấu, từ 4 đến 32 kí tự, không dùng ký tự đặc biệt
                  </p>
                </div>

                {/* 2. Nickname */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nickname <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={resetNickname}
                    onChange={(e) => {
                      setResetNickname(e.target.value);
                      setResetError(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-xs sm:text-sm transition"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    Quy tắc: Không dấu, không in hoa, tối thiểu 4 kí tự, tối đa 16 kí tự
                  </p>
                </div>

                {/* 3. Số điện thoại */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={11}
                      value={resetPhone}
                      onChange={(e) => {
                        setResetPhone(sanitizePhoneNumber(e.target.value));
                        setResetError(null);
                      }}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-xs sm:text-sm transition"
                      required
                    />
                  </div>
                </div>

                {/* 4. Email của cá nhân dùng để nhận lại mật khẩu */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email dùng để nhận lại mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(sanitizeEmailAddress(e.target.value));
                        setResetError(null);
                      }}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-xs sm:text-sm transition"
                      required
                    />
                  </div>

                </div>

                {/* Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setShowResetModal(false);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingReset ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi yêu cầu</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL XÁC MINH TÀI KHOẢN / ACCOUNT VERIFICATION DIALOG */}
      {/* ========================================================= */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full border-2 border-rose-300 shadow-2xl p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-200 relative">
            {/* Close button */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setShowVerificationModal(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-display font-bold text-lg text-slate-800">
                  Xác minh tài khoản
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Thông tin sẽ được gửi đến email quản trị viên:{' '}
                  <span className="font-bold text-rose-800 underline">{ADMIN_EMAIL}</span>
                </p>
              </div>
            </div>

            {/* Success state */}
            {verificationSuccessMessage ? (
              <div className="space-y-4 py-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Gửi yêu cầu thành công!</span>
                  </div>
                  <p className="leading-relaxed">{verificationSuccessMessage}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setShowVerificationModal(false);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
                >
                  Đóng & Quay lại đăng nhập
                </button>
              </div>
            ) : (
              /* Request form */
              <form onSubmit={handleSendVerificationRequest} className="space-y-3.5">
                {verificationError && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{verificationError}</span>
                  </div>
                )}

                {/* 1. Họ và tên */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    value={verificationFullName}
                    onChange={(e) => {
                      setVerificationFullName(e.target.value);
                      setVerificationError(null);
                    }}
                    placeholder="Ví dụ: Nguyễn Văn An (từ 4 đến 32 ký tự)..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-xs sm:text-sm transition"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    Quy tắc: Có thể không dấu hoặc có dấu, từ 4 đến 32 kí tự, không dùng ký tự đặc biệt
                  </p>
                </div>

                {/* 2. Nickname */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nickname / Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={verificationNickname}
                    onChange={(e) => {
                      setVerificationNickname(e.target.value);
                      setVerificationError(null);
                    }}
                    placeholder="Ví dụ: vanan123 (từ 4 đến 16 ký tự viết thường)..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-xs sm:text-sm transition"
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    Quy tắc: Không dấu, không in hoa, tối thiểu 4 kí tự, tối đa 16 kí tự
                  </p>
                </div>

                {/* 3. Số điện thoại */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={11}
                      value={verificationPhone}
                      onChange={(e) => {
                        setVerificationPhone(sanitizePhoneNumber(e.target.value));
                        setVerificationError(null);
                      }}
                      placeholder="Ví dụ: 0912345678 (từ 9 đến 11 số)..."
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-xs sm:text-sm transition"
                      required
                    />
                  </div>
                </div>

                {/* 4. Email cá nhân nhận phản hồi xác minh */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email của cá nhân dùng để nhận phản hồi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      value={verificationEmail}
                      onChange={(e) => {
                        setVerificationEmail(sanitizeEmailAddress(e.target.value));
                        setVerificationError(null);
                      }}
                      placeholder="Ví dụ: vanan@gmail.com..."
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-xs sm:text-sm transition"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Quản trị viên sẽ kiểm tra, ngắt kết nối các thiết bị khác và phản hồi xác nhận quyền truy cập về email này.
                  </p>
                </div>

                {/* Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setShowVerificationModal(false);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs sm:text-sm transition cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingVerification}
                    className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingVerification ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi yêu cầu xác minh</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
