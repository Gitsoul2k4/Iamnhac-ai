import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LogOut,
  Trash2,
  X,
  XCircle
} from 'lucide-react';

const NotificationContext = createContext(null);

const variantMeta = {
  success: {
    accent: '#1db954',
    bg: '#eefaf3',
    color: '#0b6b34',
    icon: CheckCircle2
  },
  error: {
    accent: '#ef4444',
    bg: '#fff1f2',
    color: '#991b1b',
    icon: XCircle
  },
  warning: {
    accent: '#f59e0b',
    bg: '#fff7ed',
    color: '#92400e',
    icon: AlertTriangle
  },
  danger: {
    accent: '#ef4444',
    bg: '#fff1f2',
    color: '#991b1b',
    icon: Trash2
  },
  logout: {
    accent: '#111827',
    bg: '#f3f4f6',
    color: '#111827',
    icon: LogOut
  },
  info: {
    accent: '#2563eb',
    bg: '#eff6ff',
    color: '#1d4ed8',
    icon: Info
  }
};

const getVariant = (type = 'info') => variantMeta[type] || variantMeta.info;

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const dismissToast = useCallback((id) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((options) => {
    const toast = {
      id: `${Date.now()}-${Math.random()}`,
      type: options?.type || 'info',
      title: options?.title || 'Thông báo',
      message: options?.message || '',
      duration: options?.duration ?? 3200
    };

    setToasts((items) => [toast, ...items].slice(0, 4));
    window.setTimeout(() => dismissToast(toast.id), toast.duration);
  }, [dismissToast]);

  const closeDialog = useCallback((value) => {
    setDialog((current) => {
      if (current?.resolve) current.resolve(value);
      return null;
    });
  }, []);

  const showConfirm = useCallback((options) => new Promise((resolve) => {
    setDialog({
      mode: 'confirm',
      type: options?.type || 'warning',
      title: options?.title || 'Xác nhận thao tác',
      message: options?.message || '',
      confirmText: options?.confirmText || 'Xác nhận',
      cancelText: options?.cancelText || 'Huỷ',
      resolve
    });
  }), []);

  const showPrompt = useCallback((options) => new Promise((resolve) => {
    setDialog({
      mode: 'prompt',
      type: options?.type || 'info',
      title: options?.title || 'Nhập thông tin',
      message: options?.message || '',
      placeholder: options?.placeholder || '',
      confirmText: options?.confirmText || 'Tiếp tục',
      cancelText: options?.cancelText || 'Huỷ',
      value: options?.defaultValue || '',
      resolve
    });
  }), []);

  const value = useMemo(() => ({
    notify,
    showConfirm,
    showPrompt
  }), [notify, showConfirm, showPrompt]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div style={toastStackStyle}>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => dismissToast(toast.id)} />
        ))}
      </div>
      {dialog && <Dialog dialog={dialog} onClose={closeDialog} />}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

const Toast = ({ toast, onClose }) => {
  const meta = getVariant(toast.type);
  const Icon = meta.icon;

  return (
    <div style={{ ...toastStyle, borderColor: meta.accent }}>
      <div style={{ ...toastIconStyle, background: meta.bg, color: meta.color }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={toastTitleStyle}>{toast.title}</div>
        {toast.message && <div style={toastMessageStyle}>{toast.message}</div>}
      </div>
      <button type="button" onClick={onClose} style={iconButtonStyle} aria-label="Đóng thông báo">
        <X size={16} />
      </button>
    </div>
  );
};

const Dialog = ({ dialog, onClose }) => {
  const [inputValue, setInputValue] = useState(dialog.value || '');
  const meta = getVariant(dialog.type);
  const Icon = meta.icon;
  const isPrompt = dialog.mode === 'prompt';
  const canSubmit = !isPrompt || inputValue.trim().length > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onClose(isPrompt ? inputValue.trim() : true);
  };

  return (
    <div style={overlayStyle} role="presentation">
      <form style={dialogStyle} onSubmit={handleSubmit}>
        <div style={dialogHeaderStyle}>
          <div style={{ ...dialogIconStyle, background: meta.bg, color: meta.color }}>
            <Icon size={24} />
          </div>
          <button type="button" onClick={() => onClose(isPrompt ? null : false)} style={iconButtonStyle} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <h2 style={dialogTitleStyle}>{dialog.title}</h2>
        {dialog.message && <p style={dialogMessageStyle}>{dialog.message}</p>}

        {isPrompt && (
          <input
            autoFocus
            value={inputValue}
            placeholder={dialog.placeholder}
            onChange={(event) => setInputValue(event.target.value)}
            style={{ ...inputStyle, borderColor: inputValue.trim() ? '#1db954' : '#d1d5db' }}
          />
        )}

        <div style={dialogActionsStyle}>
          <button type="button" onClick={() => onClose(isPrompt ? null : false)} style={secondaryButtonStyle}>
            {dialog.cancelText}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...primaryButtonStyle,
              background: canSubmit ? meta.accent : '#9ca3af',
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
          >
            {dialog.confirmText}
          </button>
        </div>
      </form>
    </div>
  );
};

const toastStackStyle = {
  position: 'fixed',
  top: '18px',
  right: '18px',
  zIndex: 5000,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: 'min(380px, calc(100vw - 36px))'
};

const toastStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '14px',
  background: '#fff',
  color: '#111827',
  border: '1px solid',
  borderRadius: '8px',
  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)',
  fontFamily: 'Arial, sans-serif'
};

const toastIconStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto'
};

const toastTitleStyle = {
  fontSize: '15px',
  fontWeight: 800,
  marginBottom: '3px'
};

const toastMessageStyle = {
  fontSize: '13px',
  lineHeight: 1.45,
  color: '#4b5563'
};

const iconButtonStyle = {
  width: '30px',
  height: '30px',
  border: 'none',
  background: 'transparent',
  color: '#6b7280',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0
};

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 4900,
  background: 'rgba(17, 24, 39, 0.58)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px'
};

const dialogStyle = {
  width: 'min(440px, 100%)',
  background: '#fff',
  color: '#111827',
  borderRadius: '8px',
  boxShadow: '0 26px 70px rgba(0, 0, 0, 0.28)',
  padding: '22px',
  fontFamily: 'Arial, sans-serif'
};

const dialogHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '18px'
};

const dialogIconStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const dialogTitleStyle = {
  margin: '0 0 8px',
  fontSize: '22px',
  lineHeight: 1.2,
  fontWeight: 900
};

const dialogMessageStyle = {
  margin: 0,
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: 1.55
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  marginTop: '18px',
  padding: '12px 14px',
  border: '1px solid',
  borderRadius: '8px',
  fontSize: '15px',
  outline: 'none'
};

const dialogActionsStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '24px'
};

const secondaryButtonStyle = {
  border: '1px solid #d1d5db',
  background: '#fff',
  color: '#374151',
  borderRadius: '8px',
  padding: '10px 16px',
  fontWeight: 800,
  cursor: 'pointer'
};

const primaryButtonStyle = {
  border: 'none',
  color: '#fff',
  borderRadius: '8px',
  padding: '10px 18px',
  fontWeight: 900
};
