import React from 'react';
import Card3D from '../components/Card3D';
import { ICONS, SAMPLE_POSTS } from '../constants';
import { Report } from '../types';
import { useNavigate } from 'react-router-dom';

interface ModerationProps {
    reports: Report[];
    onResolve: (id: string, action: 'keep' | 'remove') => void;
}

const Moderation: React.FC<ModerationProps> = ({ reports, onResolve }) => {
    const navigate = useNavigate();

    return (
        <div className="pb-20">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/profile')} className="p-2 bg-white/10 rounded-full">
                    <ICONS.X size={20} />
                </button>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <ICONS.ShieldAlert className="text-red-500" size={32} /> 
                    Moderation
                </h1>
            </header>

            <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
                <div className="bg-xs-pink/20 border border-xs-pink text-xs-pink px-4 py-2 rounded-full font-bold whitespace-nowrap">
                    Pending ({reports.length})
                </div>
                <div className="bg-white/5 border border-white/10 text-gray-400 px-4 py-2 rounded-full font-bold whitespace-nowrap">
                    Resolved
                </div>
                <div className="bg-white/5 border border-white/10 text-gray-400 px-4 py-2 rounded-full font-bold whitespace-nowrap">
                    Banned Users
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <ICONS.CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <p>All clear! No pending reports.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reports.map(report => {
                        const post = SAMPLE_POSTS.find(p => p.id === report.targetId);
                        
                        return (
                            <Card3D key={report.id} className="border-l-4 border-l-red-500" glowColor="none">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                                        <ICONS.Flag size={16} /> 
                                        <span>Reported for: {report.reason}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(report.timestamp).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>

                                {/* Content Preview */}
                                <div className="bg-black/40 rounded-lg p-4 mb-4 border border-white/10">
                                    {report.targetType === 'post' && post ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-2">
                                                <img src={post.userAvatar} className="w-6 h-6 rounded-full" />
                                                <span className="text-sm font-bold text-gray-300">{post.username}</span>
                                            </div>
                                            <p className="text-gray-400 italic mb-2">"{post.content}"</p>
                                            {post.imageUrl && (
                                                <img src={post.imageUrl} className="w-full h-32 object-cover rounded-md opacity-70" />
                                            )}
                                        </>
                                    ) : report.targetType === 'user' ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                                                <ICONS.User size={20} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">Reported User ID: {report.targetId}</p>
                                                <p className="text-xs text-gray-500">Profile Report</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Content unavailable (ID: {report.targetId})</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => onResolve(report.id, 'keep')}
                                        className="py-3 bg-white/10 rounded-lg font-bold text-gray-300 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ICONS.CheckCircle size={18} /> Keep
                                    </button>
                                    <button 
                                        onClick={() => onResolve(report.id, 'remove')}
                                        className="py-3 bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ICONS.Trash2 size={18} /> Remove
                                    </button>
                                </div>
                            </Card3D>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Moderation;