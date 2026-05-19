import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Award, Wallet, History, Coins, Medal, Star } from 'lucide-react';


export default function GamificationPage() {
    const statsQuery = useQuery({
        queryKey: ['gamification-stats'],
        queryFn: () => apiClient.get('/gamification/stats')
    });

    const transactionsQuery = useQuery({
        queryKey: ['gamification-transactions'],
        queryFn: () => apiClient.get('/gamification/transactions', { params: { page: 1, limit: 50 } })
    });

    const stats = statsQuery.data?.data;
    const transactions = transactionsQuery.data?.data || [];

    if (statsQuery.isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-pharco-blue border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Award size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Points & Rewards</h1>
                    <p className="text-sm text-slate-500 font-medium">Track your earned points and view your current level.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-none shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl">
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-indigo-100 font-medium text-sm">Available Balance</p>
                                <h3 className="text-4xl font-bold mt-2">{stats?.wallet?.currentPoints?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Wallet size={24} className="text-white" />
                            </div>
                        </div>
                        <p className="text-indigo-100 text-sm mt-6 flex items-center gap-1.5">
                            <Star size={16} /> Lifetime: {stats?.wallet?.totalPoints?.toLocaleString() || 0} points
                        </p>
                    </div>
                </div>

                <div className="border border-slate-200 shadow-sm rounded-xl bg-white">
                    <div className="p-6 flex flex-col justify-center h-full">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center">
                                <Medal size={32} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Current Level</p>
                                <h3 className="text-2xl font-bold text-slate-900">{stats?.currentLevel?.name || 'Beginner'}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border border-slate-200 shadow-sm rounded-xl bg-white">
                    <div className="p-6">
                        <p className="text-sm text-slate-500 font-medium mb-2">Next Level Progress</p>
                        {stats?.nextLevel ? (
                            <>
                                <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                                    <span>{stats.wallet?.totalPoints || 0}</span>
                                    <span>{stats.nextLevel.pointsRequired} pts</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full" 
                                        style={{ width: `${Math.min(100, ((stats.wallet?.totalPoints || 0) / stats.nextLevel.pointsRequired) * 100)}%` }} 
                                    />
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-3 text-center">
                                    {stats.nextLevel.pointsRequired - (stats.wallet?.totalPoints || 0)} points to {stats.nextLevel.name}
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm font-bold text-emerald-600">
                                Maximum Level Reached!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="border border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                        <History size={18} className="text-slate-500" />
                        Points History
                    </div>
                    <p className="text-sm text-slate-500">Recent transactions and points earned.</p>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Action</th>
                                <th className="px-6 py-3 font-semibold text-right">Points</th>
                                <th className="px-6 py-3 font-semibold text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {transactions.length > 0 ? transactions.map((t: any) => (
                                <tr key={t._id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{t.label}</td>
                                    <td className={`px-6 py-4 text-right font-bold ${t.points > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                        {t.points > 0 ? '+' : ''}{t.points}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500">
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                        No transactions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
