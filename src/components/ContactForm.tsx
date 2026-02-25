'use client';

import { useState, FormEvent } from 'react';
import { Mail, MessageSquare, Send, User, CheckCircle, AlertCircle } from 'lucide-react';

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface ContactFormProps {
  className?: string;
}

export function ContactForm({ className = '' }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const validateField = (field: keyof typeof formData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'El nombre debe tener al menos 2 caracteres';
        }
        if (value.trim().length > 100) {
          return 'El nombre no puede exceder 100 caracteres';
        }
        return undefined;

      case 'email':
        if (!value) {
          return 'El email es obligatorio';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Email inválido';
        }
        return undefined;

      case 'subject':
        if (!value || value.trim().length < 3) {
          return 'El asunto debe tener al menos 3 caracteres';
        }
        if (value.trim().length > 200) {
          return 'El asunto no puede exceder 200 caracteres';
        }
        return undefined;

      case 'message':
        if (!value || value.trim().length < 10) {
          return 'El mensaje debe tener al menos 10 caracteres';
        }
        if (value.trim().length > 5000) {
          return 'El mensaje no puede exceder 5000 caracteres';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Validar en tiempo real y limpiar error
    const error = validateField(field, value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const newErrors: FormErrors = {};
    let hasErrors = false;

    (Object.keys(formData) as Array<keyof typeof formData>).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: data.message || 'Mensaje enviado correctamente.',
        });
        // Limpiar formulario
        setFormData({ name: '', email: '', subject: '', message: '' });
        setErrors({});
      } else if (response.status === 429) {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Has enviado demasiados mensajes. Por favor, espera un poco.',
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: data.error || 'Error al enviar el mensaje. Por favor, inténtalo de nuevo.',
        });
      }
    } catch {
      setSubmitStatus({
        type: 'error',
        message: 'Error de conexión. Por favor, verifica tu internet e inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre completo <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
              errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500/20 outline-none transition-colors`}
            placeholder="Tu nombre"
          />
        </div>
        {errors.name && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
              errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500/20 outline-none transition-colors`}
            placeholder="tu@email.com"
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Asunto */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Asunto <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            id="subject"
            value={formData.subject}
            onChange={(e) => handleChange('subject', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
              errors.subject ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500/20 outline-none transition-colors`}
            placeholder="Breve descripción de tu consulta"
          />
        </div>
        {errors.subject && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.subject}
          </p>
        )}
      </div>

      {/* Mensaje */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Mensaje <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          rows={6}
          className={`w-full px-4 py-3 rounded-lg border ${
            errors.message ? 'border-red-300 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-green-500'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500/20 outline-none transition-colors resize-none`}
          placeholder="Describe tu consulta o problema en detalle..."
        />
        <div className="flex justify-between mt-1">
          {errors.message ? (
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.message}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Mínimo 10 caracteres
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formData.message.length} / 5000
          </p>
        </div>
      </div>

      {/* Mensaje de estado */}
      {submitStatus.type && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            submitStatus.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
          }`}
        >
          {submitStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{submitStatus.message}</p>
        </div>
      )}

      {/* Botón enviar */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Enviar mensaje
          </>
        )}
      </button>

      {/* Info adicional */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Responderemos en un máximo de <strong>48 horas</strong>.
      </p>
    </form>
  );
}
