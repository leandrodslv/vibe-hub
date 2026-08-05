import { useState } from 'react';
import TopBar from '../components/workspace/TopBar';
import IATab from '../components/workspace/tabs/IATab';
import ModulesTab from '../components/workspace/tabs/ModulesTab';
import OutilsTab from '../components/workspace/tabs/OutilsTab';

export default function WorkspacePage({ initialTab = 'ia', onBack }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="h-screen w-full bg-[#F9F9F9] flex flex-col font-sans text-black selection:bg-black selection:text-white overflow-hidden">
      <TopBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={onBack}
      />

      <div className="flex-1 flex overflow-hidden p-4 md:p-6 gap-6 max-w-screen-2xl mx-auto w-full">
        {activeTab === 'modules' && <ModulesTab />}
        {activeTab === 'ia' && <IATab />}
        {activeTab === 'outils' && <OutilsTab />}
      </div>
    </div>
  );
}
