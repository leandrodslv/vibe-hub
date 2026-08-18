import { useEffect, useState } from 'react';
import Sidebar from '../components/workspace/Sidebar';
import IATab from '../components/workspace/tabs/IATab';
import ModulesTab from '../components/workspace/tabs/ModulesTab';
import OutilsTab from '../components/workspace/tabs/OutilsTab';
import { appHref, tabFromSearch } from '../lib/routes';

export default function WorkspacePage() {
  // L'onglet d'entrée vient de l'URL (`/app?tab=modules`) : c'est ce qui permet à la landing
  // de pointer un espace précis du logiciel sans lui passer de props.
  const [activeTab, setActiveTab] = useState(tabFromSearch);
  // Hand-off du prompt généré par l'Assistant IA vers l'UI Builder (onglet Outils).
  const [uiBuilderPrompt, setUiBuilderPrompt] = useState(null);

  // On reflète l'onglet courant dans l'URL sans recharger : le lien reste copiable et un
  // rafraîchissement retombe sur le même onglet. `replaceState` plutôt que `pushState` —
  // les onglets ne sont pas des étapes d'historique, le retour arrière doit sortir du
  // logiciel, pas dérouler la navigation interne.
  useEffect(() => {
    window.history.replaceState(null, '', appHref(activeTab));
  }, [activeTab]);

  const sendToGenerator = (prompt) => {
    setUiBuilderPrompt(prompt);
    setActiveTab('outils');
  };

  return (
    <div className="h-screen w-full bg-surface flex flex-col md:flex-row font-body-md text-on-surface selection:bg-primary selection:text-on-primary overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 w-full md:ml-64 flex overflow-hidden p-container-margin md:p-10 pb-32 md:pb-10 gap-6 max-w-7xl mx-auto min-h-0">
        {/* Les 3 onglets restent montés en permanence (juste masqués) pour éviter de recharger
            leurs données et de reperdre leur état à chaque changement d'onglet. `min-h-0` est
            nécessaire ici et sur chaque enfant flex de la chaîne : un flex item refuse par défaut
            de rétrécir sous la hauteur de son contenu, ce qui neutralise silencieusement tout
            `overflow-hidden`/`overflow-y-auto` plus bas dans l'arbre. */}
        <div className={`w-full h-full min-h-0 overflow-hidden ${activeTab === 'modules' ? '' : 'hidden'}`}>
          <ModulesTab />
        </div>
        <div className={`w-full h-full min-h-0 overflow-hidden ${activeTab === 'ia' ? '' : 'hidden'}`}>
          <IATab onSendToGenerator={sendToGenerator} />
        </div>
        <div className={`w-full h-full min-h-0 overflow-hidden ${activeTab === 'outils' ? '' : 'hidden'}`}>
          <OutilsTab initialPrompt={uiBuilderPrompt} />
        </div>
      </main>
    </div>
  );
}
