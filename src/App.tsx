/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FileText, Plus, Trash2, Settings, User, Users, AlignRight, Edit3, Bookmark, Printer } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import idfLogo from './icons/Badge_of_the_Israeli_Defense_Forces.svg';
import bahad1Logo from './icons/Bahad_1_Symbol.SVG.png';

// @ts-ignore
import html2pdf from 'html2pdf.js';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DocumentData {
  classification: string;
  unitName: string;
  subUnitName: string;
  senderDetailsText: string;
  toRecipients: { value: string }[];
  ccRecipients: { value: string }[];
  subject: string;
  body: string;
  gender: string;
  rank: string;
  fullName: string;
  roleTitle: string;
  slogan: string;
  signatureImage?: string | null;
}

const defaultValues: DocumentData = {
  classification: 'בלמ"ס',
  unitName: 'בית הספר לקצינים',
  subUnitName: 'ענף ההדרכה',
  senderDetailsText: `טלפון מטכ"לי: 03-9876443
טלפון אזרחי: 03-1928376
מספר פקס: 03-1928376
כ"ג באדר התשפ"ו
12 במרץ 2026`,
  toRecipients: [{ value: 'בה"ד 1-מגמת נחשון-גדוד ארז-מ"פ דותן-סרן אבי כהן' }],
  ccRecipients: [{ value: 'בה"ד 1-מגמת נחשון-גדוד ארז-מפקדת צוות 16-סגן ישראלה ישראל' }],
  subject: 'צוער/ת בבית הספר לקצינים',
  body: '1. פסקה ראשונה של המכתב.\nא. תת-סעיף ראשון.\n1) תת-תת-סעיף ראשון.\n2. פסקה שנייה של המכתב.',
  gender: 'זכר',
  rank: 'צוער',
  fullName: 'דולב כהן',
  roleTitle: 'צוער בבית הספר לקצינים',
  slogan: 'סלוגן לדוגמה',
  signatureImage: null,
};

export default function App() {
  const { register, control, watch, handleSubmit, setValue } = useForm<DocumentData>({
    defaultValues,
  });

  const { fields: toFields, append: appendTo, remove: removeTo } = useFieldArray({
    control,
    name: 'toRecipients',
  });

  const { fields: ccFields, append: appendCc, remove: removeCc } = useFieldArray({
    control,
    name: 'ccRecipients',
  });

  const data = watch();

  const previewRef = React.useRef<HTMLDivElement>(null);

  const splitToThree = (str: string) => {
    const words = (str || '').trim().split(/\s+/);
    if (words.length === 0 || (words.length === 1 && words[0] === '')) return ['', '', ''];
    if (words.length === 1) return [words[0], '', ''];
    if (words.length === 2) return [words[0], '', words[1]];

    const base = Math.floor(words.length / 3);
    const remainder = words.length % 3;

    const s1 = base + (remainder > 0 ? 1 : 0);
    const s2 = base + (remainder > 1 ? 1 : 0);

    return [
      words.slice(0, s1).join(' '),
      words.slice(s1, s1 + s2).join(' '),
      words.slice(s1 + s2).join(' ')
    ];
  };

  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue('signatureImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    const element = previewRef.current;
    if (!element) return;

    setIsGenerating(true);

    // Create a hidden wrapper for the clone
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '-9999px';
    document.body.appendChild(wrapper);

    // Clone the preview element and force A4 dimensions in pixels
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '794px';       // A4 width at 96 DPI
    clone.style.height = '1122px';     // Strict A4 height to prevent blank extra page
    clone.style.overflow = 'hidden';
    clone.style.position = 'relative'; // Required for absolute footer
    clone.style.padding = '2.5cm';     // Ensure strict margin padding
    clone.style.boxSizing = 'border-box';
    clone.style.backgroundColor = '#ffffff';
    clone.style.minHeight = '';
    clone.classList.remove('w-full', 'w-[210mm]', 'max-w-[210mm]');

    // 1. Move To/CC blocks higher by shrinking the Header gap (moderate lift to avoid overlap)
    const headerBlock = clone.querySelector('.h-\\[8cm\\]') as HTMLElement;
    if (headerBlock) {
      headerBlock.classList.remove('h-[8cm]');
      headerBlock.style.height = '6.5cm'; // Leaves enough room for sender details
    }

    // 2. Fix Underline Strikethrough by replacing with tighter border-bottom spans
    const underlineEls = clone.querySelectorAll('.underline');
    underlineEls.forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.classList.remove('underline', 'decoration-1', 'underline-offset-2');
      htmlEl.style.textDecoration = 'none';
      
      const leafNodes = Array.from(htmlEl.querySelectorAll('*')).filter(node => node.children.length === 0 && node.textContent?.trim());
      if (leafNodes.length > 0) {
         leafNodes.forEach(node => {
            const span = document.createElement('span');
            span.innerHTML = node.innerHTML;
            span.style.borderBottom = '1px solid black';
            span.style.paddingBottom = '0.1em'; // Tighter to text to avoid overlap with lines below
            span.style.display = 'inline-block';
            node.innerHTML = '';
            node.appendChild(span);
         });
      } else if (htmlEl.textContent?.trim()) {
         htmlEl.style.borderBottom = '1px solid black';
         htmlEl.style.paddingBottom = '0.1em';
         htmlEl.style.display = 'inline-block';
      }
    });

    // 3. Prevent margin-collapse for empty lines in HTML2Canvas
    const bodyContainer = clone.querySelector('.text-justify');
    if (bodyContainer) {
       Array.from(bodyContainer.children).forEach(line => {
           if (!line.textContent?.trim()) {
               (line as HTMLElement).innerHTML = '<div style="height: 1.5rem"></div>'; // Explicit spacer
           }
       });
    }

    // 4. Pin Footer/Slogan strictly to the center bottom of the clone layer
    const sloganDiv = clone.querySelector('tfoot .text-center.font-bold') as HTMLElement;
    if (sloganDiv) {
      // Detach slogan from the table and pin it directly to the A4 page root
      sloganDiv.style.position = 'absolute';
      sloganDiv.style.bottom = '2.5cm';
      sloganDiv.style.left = '0';
      sloganDiv.style.right = '0';
      sloganDiv.style.textAlign = 'center';
      sloganDiv.style.width = '100%';
      clone.appendChild(sloganDiv);
      
      // Hide the old tfoot structure to prevent double rendering
      const tfoot = clone.querySelector('tfoot') as HTMLElement;
      if (tfoot) tfoot.style.display = 'none';
    }

    wrapper.appendChild(clone);

    const opt = {
      margin: 0,
      filename: 'military_document.pdf',
      image: { type: 'jpeg' as const, quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, windowWidth: 794 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      const generatePdf = typeof html2pdf === 'function' ? html2pdf : (html2pdf as any).default;
      await generatePdf().set(opt).from(clone).save();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      window.print(); // fallback
    } finally {
      document.body.removeChild(wrapper);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans print:bg-white" dir="rtl">
      {/* Header - Hidden in print */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-semibold text-slate-800">מחולל מסמכים צבאיים</h1>
          </div>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Printer className={cn("w-4 h-4", isGenerating && "animate-pulse")} />
            {isGenerating ? 'מייצר PDF...' : 'הורד כ-PDF'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:m-0 print:max-w-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">

          {/* Form Section - Hidden in print */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-8">

              {/* Section 1: Document Parameters */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <Settings className="w-5 h-5" />
                  <h2 className="text-lg font-semibold text-slate-800">פרמטרי המסמך</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">רמת סיווג</label>
                  <select
                    {...register('classification')}
                    className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50"
                  >
                    <option value="בלמ&quot;ס">בלמ"ס</option>
                    <option value="שמור">שמור</option>
                    <option value="סודי">סודי</option>
                    <option value="סודי ביותר">סודי ביותר</option>
                  </select>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Section 2: Sender Details */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <User className="w-5 h-5" />
                  <h2 className="text-lg font-semibold text-slate-800">פרטי המוען</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">שם יחידה</label>
                      <input type="text" {...register('unitName')} className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">שם תת-יחידה</label>
                      <input type="text" {...register('subUnitName')} className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">פרטי המוען (טקסט חופשי)</label>
                    <textarea
                      {...register('senderDetailsText')}
                      rows={6}
                      className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-mono text-sm"
                      dir="rtl"
                    />
                    <p className="text-xs text-slate-500 mt-1">השתמש בפורמט "תווית: ערך" (למשל טלפון מטכ"לי: 03-1234567)</p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Section 3: Recipient Details */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <Users className="w-5 h-5" />
                  <h2 className="text-lg font-semibold text-slate-800">פרטי הנמען</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">אל (לפעולה)</label>
                    <div className="space-y-2">
                      {toFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <input
                            {...register(`toRecipients.${index}.value`)}
                            className="flex-1 rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                          />
                          <button type="button" onClick={() => removeTo(index)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => appendTo({ value: '' })} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                        <Plus className="w-4 h-4" /> הוסף נמען
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">דע (לידיעה)</label>
                    <div className="space-y-2">
                      {ccFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                          <input
                            {...register(`ccRecipients.${index}.value`)}
                            className="flex-1 rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                          />
                          <button type="button" onClick={() => removeCc(index)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => appendCc({ value: '' })} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                        <Plus className="w-4 h-4" /> הוסף נמען
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Section 4: Main Content */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <AlignRight className="w-5 h-5" />
                  <h2 className="text-lg font-semibold text-slate-800">התוכן</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">הנדון</label>
                    <input type="text" {...register('subject')} className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">גוף המכתב</label>
                    <textarea
                      {...register('body')}
                      rows={8}
                      className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-mono text-sm leading-relaxed"
                      dir="rtl"
                      placeholder="1. סעיף ראשון&#10;   א. תת סעיף&#10;      1) תת-תת סעיף"
                    />
                    <p className="text-xs text-slate-500 mt-2">השתמש ברווחים כדי ליצור הזחות (למשל 3 רווחים לרמה א', 6 רווחים לרמה 1)).</p>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Section 5: Signature */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <Edit3 className="w-5 h-5" />
                  <h2 className="text-lg font-semibold text-slate-800">חתימה</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">לשון</label>
                    <select {...register('gender')} className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50">
                      <option value="זכר">זכר</option>
                      <option value="נקבה">נקבה</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">דרגה</label>
                    <select {...register('rank')} className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50">
                      <option value="צוער">צוער</option>
                      <option value="צוערת">צוערת</option>
                      <option value='סג"מ'>סג"מ</option>
                      <option value="סגן">סגן</option>
                      <option value="סרן">סרן</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">שם מלא</label>
                    <input type="text" {...register('fullName')} className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">כותרת תפקיד</label>
                    <input type="text" {...register('roleTitle')} className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">העלה חתימה (תמונה)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleSignatureUpload}
                        className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {watch('signatureImage') && (
                        <button 
                          type="button" 
                          onClick={() => setValue('signatureImage', null)}
                          className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                          מחק חתימה
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Section 6: Page Slogan */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-indigo-600">
                  <Bookmark className="w-5 h-5" />
                  <h2 className="text-lg font-semibold text-slate-800">סלוגן העמוד</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">סלוגן</label>
                  <input type="text" {...register('slogan')} className="w-full rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50" />
                </div>
              </section>

            </div>
          </div>

          {/* Preview Section - This becomes the printed page */}
          <div className="lg:col-span-7 print:col-span-12">
            <div className="sticky top-24 print:static">
              <div className="bg-white shadow-xl rounded-none sm:rounded-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:w-full print:h-full">

                {/* A4 Page Container */}
                <div ref={previewRef} className="w-full bg-[#ffffff] font-david text-[12pt] leading-[1.5] text-[#000000] mx-auto relative print:m-0 print-no-padding"
                  dir="rtl"
                  style={{
                    minHeight: '297mm', // A4 height
                    padding: '2.5cm', // Minimum 2.5cm margins
                    boxSizing: 'border-box'
                  }}>

                  <table className="w-full">
                    <thead className="table-header-group">
                      <tr>
                        <td>
                          {/* Header Block - Repeats on every printed page */}
                          <div className="relative h-[8cm] w-full">
                            {/* Classification & Page Number (Center) */}
                            <div className="absolute top-0 left-0 right-0 text-center">
                              <div className="font-bold underline decoration-1 underline-offset-2">{data.classification}</div>
                              <div className="mt-1 print:hidden">1</div>
                              <div className="mt-1 hidden print:block page-number"></div>
                            </div>

                            {/* Logo (Top-Right) */}
                            <div className="absolute top-[2cm] right-0 h-[1.8cm] flex gap-2 items-center justify-end print:border-none print:bg-transparent">
                              <img src={idfLogo} alt="לוגו צהל" className="h-full object-contain" />
                              <img src={bahad1Logo} alt="לוגו בהד 1" className="h-full object-contain" />
                            </div>

                            {/* Sender Details (Top-Left, "Cube" layout) */}
                            <div className="absolute top-[2cm] left-0" dir="rtl">
                              <table className="w-64 border-collapse border-none leading-tight table-fixed">
                                <tbody>
                                  {/* Unit Name Row */}
                                  <tr>
                                    {splitToThree(data.unitName).map((part, i) => (
                                      <td key={i} className={cn("w-1/3 font-bold pb-1 whitespace-nowrap align-top", i === 0 ? "text-right" : i === 1 ? "text-center" : "text-left")}>
                                        {part}
                                      </td>
                                    ))}
                                  </tr>
                                  {/* Sub-Unit Name Row */}
                                  {data.subUnitName && (
                                    <tr>
                                      {splitToThree(data.subUnitName).map((part, i) => (
                                        <td key={i} className={cn("w-1/3 font-bold pb-1 whitespace-nowrap align-top", i === 0 ? "text-right" : i === 1 ? "text-center" : "text-left")}>
                                          {part}
                                        </td>
                                      ))}
                                    </tr>
                                  )}
                                  {/* Detail Rows */}
                                  {data.senderDetailsText.split('\n').filter(Boolean).map((line, i) => {
                                    const parts = splitToThree(line);
                                    return (
                                      <tr key={i}>
                                        {parts.map((part, j) => (
                                          <td key={j} className={cn("w-1/3 whitespace-nowrap align-top", j === 0 ? "text-right" : j === 1 ? "text-center" : "text-left")}>
                                            {part}
                                          </td>
                                        ))}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </thead>

                    <tfoot className="table-footer-group">
                      <tr>
                        <td>
                          {/* Fixed Slogan - Repeats on every printed page */}
                          <div className="relative h-[2cm] w-full">
                            <div className="absolute bottom-0 left-0 right-0 text-center font-bold">
                              {data.slogan}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tfoot>

                    <tbody>
                      <tr>
                        <td>
                          {/* Main Content Wrapper */}
                          <div className="relative">
                            {/* Fixed Recipient Block */}
                            <div className="mb-8">
                              {data.toRecipients.some(r => r.value.trim()) && (
                                <div className="flex underline decoration-1 underline-offset-2">
                                  <div className="w-8">אל:</div>
                                  <div className="flex-1">
                                    {data.toRecipients.filter(r => r.value.trim()).map((r, i) => (
                                      <div key={i}>{r.value}</div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {data.ccRecipients.some(r => r.value.trim()) && (
                                <div className={`flex ${data.toRecipients.some(r => r.value.trim()) ? 'mt-1' : ''}`}>
                                  <div className="w-8">דע:</div>
                                  <div className="flex-1">
                                    {data.ccRecipients.filter(r => r.value.trim()).map((r, i) => (
                                      <div key={i}>{r.value}</div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Greeting */}
                            <div className="mb-[1.5em]">
                              שלום רב,
                            </div>

                            {/* Fixed Subject */}
                            <div className="text-center font-bold mb-[3em]"> {/* 2 line gap below */}
                              הנדון: <span className="underline decoration-1 underline-offset-2">{data.subject}</span>
                            </div>

                            {/* Fixed Body Text */}
                            <div className="mb-24 text-justify">
                              {data.body.split('\n').map((line, i) => {
                                const trimmedLine = line.trim();
                                const leadingSpaces = line.match(/^ */)?.[0].length || 0;
                                
                                // Automatic military indentation levels
                                let autoPadding = 0;
                                if (/^[א-ת]\./.test(trimmedLine)) autoPadding = 1.5;      // Level 2: א.
                                else if (/^\d+\)/.test(trimmedLine)) autoPadding = 3;     // Level 3: 1)
                                else if (/^[א-ת]\)/.test(trimmedLine)) autoPadding = 4.5; // Level 4: א)
                                
                                const totalPaddingRem = (leadingSpaces / 3) * 1.5 + autoPadding;
                                const paddingRight = `${totalPaddingRem}rem`;
                                const isEmptyBlockSpacing = !trimmedLine;

                                return (
                                  <div key={i} style={{ 
                                      paddingRight: paddingRight, 
                                      marginBottom: isEmptyBlockSpacing ? '1.5em' : '0'
                                  }}>
                                    {trimmedLine || '\u00A0'}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Fixed Signature Block */}
                            <div className="mt-16 flex justify-end">
                              <div className="w-64" dir="rtl">
                                <div className="text-right">בברכה,</div>
                                <div className="h-20 flex items-center justify-center">
                                  {data.signatureImage ? (
                                    <img src={data.signatureImage} alt="חתימה" className="max-h-full max-w-full object-contain" />
                                  ) : (
                                    <div className="h-full"></div>
                                  )}
                                </div> {/* Space for physical signature or image */}
                                <table className="w-full border-collapse border-none leading-tight table-fixed">
                                  <tbody>
                                    <tr>
                                      {splitToThree(`${data.rank} ${data.fullName}`).map((part, i) => (
                                        <td key={i} className={cn("w-1/3 font-bold whitespace-nowrap align-top", i === 0 ? "text-right" : i === 1 ? "text-center" : "text-left")}>
                                          {part}
                                        </td>
                                      ))}
                                    </tr>
                                    <tr>
                                      {splitToThree(data.roleTitle).map((part, i) => (
                                        <td key={i} className={cn("w-1/3 whitespace-nowrap align-top", i === 0 ? "text-right" : i === 1 ? "text-center" : "text-left")}>
                                          {part}
                                        </td>
                                      ))}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4;
            margin: 2.5cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            counter-reset: page;
          }
          .page-number::after {
            counter-increment: page;
            content: counter(page);
          }
          .print-no-padding {
            padding: 0 !important;
          }
        }
        /* Ensure tfoot adheres to the very bottom */
        .table-footer-group {
          display: table-footer-group;
          vertical-align: bottom;
        }
      `}} />
    </div>
  );
}
