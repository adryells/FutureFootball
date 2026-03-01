import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users } from 'lucide-react';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('seenOnboarding');
    if (!seen) {
      setShowOnboarding(true);
    }
    // apply saved theme
    const theme = localStorage.getItem('theme');
    const root = document.getElementById('root');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      if (root) root.classList.add('dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      if (root) root.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const closeOnboarding = () => {
    localStorage.setItem('seenOnboarding', '1');
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-16">
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-5xl font-bold text-gray-900">Football Future</h1>
            <button
              onClick={() => {
                const root = document.getElementById('root');
                const next = !isDark;
                setIsDark(next);
                if (next) {
                  document.documentElement.classList.add('dark');
                  if (root) root.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                  if (root) root.classList.remove('dark');
                }
                localStorage.setItem('theme', next ? 'dark' : 'light');
              }}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
            >
              {isDark ? 'Tema: Escuro' : 'Tema: Claro'}
            </button>
          </div>
          <p className="text-xl text-gray-600">
            Simule universos de futebol completos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/universos"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 rounded-full p-6 mb-4 group-hover:bg-indigo-200 transition-colors">
                <Trophy className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Universos
              </h2>
              <p className="text-gray-600">
                Crie e gerencie seus universos de futebol, temporadas e competições
              </p>
            </div>
          </Link>

          <Link
            to="/clubes"
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 rounded-full p-6 mb-4 group-hover:bg-green-200 transition-colors">
                <Users className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Clubes
              </h2>
              <p className="text-gray-600">
                Gerencie seus clubes, adicione logos, defina força e país
              </p>
            </div>
          </Link>
        </div>
      </div>

      {showOnboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Bem-vindo ao Football Future!</h2>
            <p className="mb-2">
              Para começar, crie seu primeiro universo clicando em <strong>Universos</strong>.
            </p>
            <p className="mb-2">
              Depois, abra o universo e use <strong>Gerar Estrutura</strong> para criar 4 divisões e uma temporada inicial ou personalize à vontade.
            </p>
            <p className="mb-4">
              Você também pode ir em <strong>Clubes</strong> para importar um pacote de clubes, definir forças e logos.
            </p>
            <button
              onClick={closeOnboarding}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Entendi, vamos lá!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

