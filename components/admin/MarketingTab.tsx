
import React, { useState, useEffect } from 'react';
import { Event as EventType } from '../../types';
import CompetitionsTab from './CompetitionsTab';
import PromoCodesTab from './PromoCodesTab';
import FormsTab from './FormsTab';

const MarketingTab: React.FC<{ event: EventType, onEventUpdate: () => void }> = ({ event, onEventUpdate }) => {
    const [activeSubTab, setActiveSubTab] = useState<'competitions' | 'promocodes' | 'forms'>('competitions');

    // If the current event is a fundraiser, and the user somehow landed on the 'promocodes' tab,
    // redirect them to the first available tab.
    useEffect(() => {
        if (event.type === 'fundraiser' && activeSubTab === 'promocodes') {
            setActiveSubTab('competitions');
        }
    }, [event.type, activeSubTab]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-white">Marketing</h1>
            
            <div className="border-b border-neutral-800">
                <nav className="flex -mb-px space-x-8">
                    <button 
                        onClick={() => setActiveSubTab('competitions')} 
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                            activeSubTab === 'competitions' ? 'border-purple-500 text-white' : 'border-transparent text-neutral-400 hover:text-white'
                        }`}
                    >
                        Competitions
                    </button>
                    {event.type !== 'fundraiser' && (
                        <button 
                            onClick={() => setActiveSubTab('promocodes')} 
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                                activeSubTab === 'promocodes' ? 'border-purple-500 text-white' : 'border-transparent text-neutral-400 hover:text-white'
                            }`}
                        >
                            Promo Codes
                        </button>
                    )}
                    <button 
                        onClick={() => setActiveSubTab('forms')} 
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all ${
                            activeSubTab === 'forms' ? 'border-purple-500 text-white' : 'border-transparent text-neutral-400 hover:text-white'
                        }`}
                    >
                        Forms
                    </button>
                </nav>
            </div>

            <div>
                {activeSubTab === 'competitions' && (
                    <div className="animate-fade-in">
                       <CompetitionsTab event={event} onEventUpdate={onEventUpdate} />
                    </div>
                )}
                {activeSubTab === 'promocodes' && event.type !== 'fundraiser' && (
                    <div className="animate-fade-in">
                        <PromoCodesTab event={event} />
                    </div>
                )}
                {activeSubTab === 'forms' && (
                    <div className="animate-fade-in">
                        <FormsTab event={event} onEventUpdate={onEventUpdate} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketingTab;