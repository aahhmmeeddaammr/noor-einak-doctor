import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api-client';
import { Gift, Coins, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

export default function RewardsPage() {
    const queryClient = useQueryClient();
    const [selectedReward, setSelectedReward] = useState<any>(null);
    const [redemptionData, setRedemptionData] = useState<any>(null);
    const [isDownloaded, setIsDownloaded] = useState(false);

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
        onSuccess: (response: any) => {
            queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
            queryClient.invalidateQueries({ queryKey: ['gamification-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['rewards'] });
            toast.success('Reward redeemed successfully!');
            setRedemptionData(response?.data?.redemption);
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

            <Dialog 
                open={Boolean(selectedReward)} 
                onOpenChange={(open) => {
                    if (!open) {
                        if (redemptionData && !isDownloaded) {
                            const confirmClose = window.confirm("Please make sure you have saved or downloaded the QR code. If you close this window, you might lose access to it. Close anyway?");
                            if (!confirmClose) return;
                        }
                        setSelectedReward(null);
                        setRedemptionData(null);
                        setIsDownloaded(false);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    {!redemptionData ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <DialogHeader className="text-center flex flex-col items-center">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full mb-2">
                                    <CheckCircle2 size={36} />
                                </div>
                                <DialogTitle className="text-xl font-bold text-slate-900">Reward Redeemed!</DialogTitle>
                                <DialogDescription className="text-sm text-slate-500 mt-1">
                                    Show this QR code to the partner to claim your reward.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-6 flex flex-col items-center gap-4">
                                <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-inner">
                                    <img 
                                        src={redemptionData.qrCodeDataUrl} 
                                        alt="Redemption QR Code" 
                                        className="w-48 h-48 object-contain"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                    This QR code can only be used once
                                </p>
                            </div>

                            <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-medium">Reward</span>
                                    <span className="font-bold text-slate-800 text-right max-w-[65%] truncate">{selectedReward?.name}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                    <span className="text-slate-500 font-medium">Points Spent</span>
                                    <span className="font-bold text-indigo-600">{selectedReward?.pointsCost?.toLocaleString()} pts</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                                    <span className="text-slate-500 font-medium">Serial Number</span>
                                    <span className="font-mono font-bold text-slate-700 tracking-wider">{redemptionData.serialNumber}</span>
                                </div>
                            </div>

                            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                                <Button 
                                    className={`w-full font-bold flex items-center justify-center gap-2 ${
                                        isDownloaded 
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800' 
                                            : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800'
                                    }`}
                                    variant="outline"
                                    onClick={() => {
                                        if (!redemptionData?.qrCodeDataUrl) return;
                                        const link = document.createElement('a');
                                        link.href = redemptionData.qrCodeDataUrl;
                                        link.download = `QR_${redemptionData.serialNumber || 'reward'}.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                        setIsDownloaded(true);
                                        toast.success('QR Code saved successfully!');
                                    }}
                                >
                                    <Download size={16} />
                                    {isDownloaded ? 'QR Saved!' : 'Download QR Code'}
                                </Button>
                                <Button 
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
                                    onClick={() => {
                                        setSelectedReward(null);
                                        setRedemptionData(null);
                                        setIsDownloaded(false);
                                    }}
                                >
                                    Done
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
