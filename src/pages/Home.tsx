import { Link } from 'react-router-dom';
import { Trophy, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Football Future
          </h1>
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
    </div>
  );
}

