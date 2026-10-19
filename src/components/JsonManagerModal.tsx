import React, { useState } from 'react';
import { X, Code2, Copy, Check, RotateCcw, Download, Upload, AlertCircle } from 'lucide-react';
import { UnitData } from '../types';
import { DEFAULT_UNITS_DATA } from '../data/unitsData';
import { soundEffects } from '../services/soundEffects';

interface JsonManagerModalProps {
  currentUnits: UnitData[];
  grade: 4 | 7;
  onImportUnits: (newUnits: UnitData[]) => void;
  onResetDefault: () => void;
  onClose: () => void;
}

export const JsonManagerModal: React.FC<JsonManagerModalProps> = ({
  currentUnits,
  grade,
  onImportUnits,
  onResetDefault,
  onClose
}) => {
  const [jsonText, setJsonText] = useState(() => JSON.stringify(currentUnits, null, 2));
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCopy = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Dữ liệu JSON phải là một mảng danh sách [ ... ] chứa các Unit.');
      }

      if (parsed.length === 0) {
        throw new Error('Mảng dữ liệu không được rỗng.');
      }

      // Basic validation
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.unit || !item.title || !Array.isArray(item.vocabulary)) {
          throw new Error(`Unit tại vị trí ${i + 1} thiếu trường bắt buộc (cần 'unit', 'title', 'vocabulary').`);
        }
      }

      soundEffects.playSuccess();
      onImportUnits(parsed);
      setSuccessMsg(`Đã nhập thành công ${parsed.length} Unit học tập!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      soundEffects.playError();
      const message = err instanceof Error ? err.message : 'Định dạng JSON không hợp lệ!';
      setErrorMsg(message);
    }
  };

  const handleReset = () => {
    soundEffects.playClick();
    if (window.confirm(`Bạn có chắc muốn khôi phục lại dữ liệu gốc Tiếng Anh Lớp ${grade}?`)) {
      onResetDefault();
      setSuccessMsg(`Đã khôi phục về dữ liệu mặc định Lớp ${grade} thành công!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl p-6 sm:p-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl">
              💻
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-800">
                Quản lý dữ liệu & nhập JSON
              </h2>
              <p className="text-xs text-slate-500">
                Dán kết quả trích xuất từ NotebookLM hoặc sao chép dữ liệu hiện tại
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational tip */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 leading-relaxed">
          💡 <strong>Mẹo hay:</strong> Bạn có thể dán toàn bộ mảng JSON từ NotebookLM vào ô bên dưới rồi nhấn <strong>"Áp dụng dữ liệu mới"</strong>. Hệ thống sẽ tự động cập nhật tất cả từ vựng, bài đố và màn chơi!
        </div>

        {/* Textarea */}
        <div className="flex-1 min-h-[260px] relative">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full h-full min-h-[260px] p-4 bg-slate-900 text-amber-300 font-mono text-xs rounded-2xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none selection:bg-amber-600 selection:text-white"
            placeholder="Dán mã JSON bài học tại đây..."
            spellCheck={false}
          />

          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Đã sao chép' : 'Sao chép JSON'}
          </button>
        </div>

        {/* Error / Success message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" /> {successMsg}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Khôi phục toàn bộ Unit gốc
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-display font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
            >
              Áp dụng dữ liệu mới 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
