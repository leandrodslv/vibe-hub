import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQS } from '../../data/courses';

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <section id="faq" className="py-32 px-6 bg-[#F9F9F9] border-t border-[#EAEAEA]">
      <div className="max-w-3xl mx-auto reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out">
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Questions fréquentes.</h2>
          <p className="text-xl text-[#666666] font-normal">Tout ce que vous devez savoir avant de nous rejoindre.</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className="border border-[#EAEAEA] rounded-2xl overflow-hidden bg-[#F9F9F9] transition-all duration-300"
            >
              <button
                className="w-full text-left px-8 py-6 flex items-center justify-between font-bold text-lg hover:text-[#666666] transition-colors"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                {faq.question}
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`px-8 overflow-hidden transition-all duration-300 ease-in-out ${
                  openFaq === index ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-[#666666] leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
