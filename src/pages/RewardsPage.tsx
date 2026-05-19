import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';
import { Gift, Coins, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

export default function RewardsPage() {
    const queryClient = useQueryClient();
    const [selectedReward, setSelectedReward] = useState<any>(null);

    const statsQuery = useQuery({
        queryKey: ['gamification-stats'],
        queryFn: () => apiClient.get('/gamification/stats')
    });

    const rewardsQuery = useQuery({
        queryKey: ['rewards'],
        queryFn: () => apiClient.get('/rewards')
    });

    const redeemMutation = useMutation({
        mutationFn: (id: string) => apiClient.post(`/rewards/${id}/redeem`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
            queryClient.invalidateQueries({ queryKey: ['gamification-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['rewards'] });
            toast.success('Reward redeemed successfully!');
            setSelectedReward(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || error.message || 'Failed to redeem reward');
        }
    });

    const rewards = rewardsQuery.data?.data || [];
    const points = statsQuery.data?.data?.wallet?.currentPoints || 0;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Gift size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Rewards Catalog</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Redeem your earned points for exclusive rewards.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
                    <Coins size={20} className="text-amber-500" />
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Available Points</p>
                        <p className="text-xl font-bold text-slate-900">{points.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {rewardsQuery.isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
                </div>
            ) : rewards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <AlertCircle size={48} className="text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No Rewards Available</h3>
                    <p className="text-slate-500 font-medium">Check back later for new rewards!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {rewards.map((reward: any) => (
                        <div key={reward._id} className="overflow-hidden border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col bg-white">
                            <div className="h-48 bg-slate-100 relative">
                                {reward.imageUrl ? (
                                    <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Gift size={48} />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-sm text-amber-600 shadow-sm flex items-center gap-1.5">
                                    <Coins size={14} />
                                    {reward.pointsCost.toLocaleString()} pts
                                </div>
                            </div>
                            <div className="p-5 flex-1">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">{reward.name}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{reward.description}</p>
                                {reward.partnerId && (
                                    <Badge variant="outline" className="mt-3 bg-slate-50 text-slate-600 border-slate-200">
                                        {reward.partnerId.name}
                                    </Badge>
                                )}
                            </div>
                            <div className="p-5 pt-0">
                                <Button 
                                    className="w-full font-bold shadow-sm"
                                    onClick={() => setSelectedReward(reward)}
                                    disabled={points < reward.pointsCost}
                                    variant={points >= reward.pointsCost ? 'default' : 'secondary'}
                                >
                                    {points >= reward.pointsCost ? 'Redeem Reward' : 'Not Enough Points'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={Boolean(selectedReward)} onOpenChange={(open) => !open && setSelectedReward(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Redemption</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to redeem <strong>{selectedReward?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="font-medium text-slate-600">Points Cost</span>
                            <span className="font-bold text-rose-500 text-lg">-{selectedReward?.pointsCost?.toLocaleString()}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedReward(null)} disabled={redeemMutation.isPending}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={() => redeemMutation.mutate(selectedReward?._id)} 
                            disabled={redeemMutation.isPending}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                        >
                            {redeemMutation.isPending ? 'Redeeming...' : 'Confirm Redemption'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
