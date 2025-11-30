import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TicketOption } from '../types';
import { TrashIcon, PlusIcon, GripVerticalIcon, ChevronDownIcon } from './Icons';

interface Wrapper {
    data: TicketOption;
    uiKey: string;
}

interface TicketEditorProps {
    tickets: TicketOption[];
    onTicketsChange: (tickets: TicketOption[]) => void;
    isFundraiser?: boolean;
}

const EditableTicketItem: React.FC<{
    ticket: TicketOption,
    uiKey: string,
    isExpanded: boolean,
    onToggle: () => void,
    onUpdate: (key: string, field: keyof TicketOption, value: any) => void,
    onDelete: () => void,
    isFundraiser: boolean,
}> = ({ ticket, uiKey, isExpanded, onToggle, onUpdate, onDelete, isFundraiser }) => {
    
    const soldCount = ticket.sold || 0;
    const maxCount = ticket.quantity;
    const hasCapacity = maxCount !== undefined && maxCount !== null;
    const percentage = hasCapacity && maxCount > 0 ? Math.min((soldCount / maxCount) * 100, 100) : 0;
    const isSoldOut = hasCapacity && soldCount >= maxCount;

    const formatDateForInput = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    };

    return (
        <div className={`bg-neutral-900 border rounded-2xl transition-all duration-300 group ${isExpanded ? 'border-purple-500 shadow-lg shadow-purple-500/10' : 'border-neutral-800 hover:border-neutral-700'}`}>
            {/* --- Summary View (Header) --- */}
            <div 
                className="flex items-center p-4 cursor-pointer"
                onClick={onToggle}
            >
                <div className="text-neutral-500 cursor-grab p-2 -ml-2"><GripVerticalIcon className="w-5 h-5"/></div>
                
                <div className="flex-grow mx-4">
                    <div className="flex items-center gap-3">
                        <h4 className="font-bold text-white truncate">{ticket.type || 'Untitled Ticket'}</h4>
                        {isSoldOut && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">Sold Out</span>}
                        {!isSoldOut && ticket.id && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">Active</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400 mt-2">
                        <span>{isFundraiser ? 'Suggested: ' : ''}<span className="font-mono font-semibold">${(ticket.price || 0).toFixed(2)}</span></span>
                        {hasCapacity && <span>Capacity: <span className="font-mono font-semibold">{maxCount}</span></span>}
                        {hasCapacity && (
                            <div className="flex items-center gap-2">
                                <span>Sales:</span>
                                <div className="w-16 h-1 bg-neutral-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${isSoldOut ? 'bg-red-500' : 'bg-purple-500'}`} style={{width: `${percentage}%`}}></div>
                                </div>
                                <span className="font-mono text-neutral-500">{soldCount}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                    <ChevronDownIcon className={`w-6 h-6 text-neutral-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* --- Expanded Form View --- */}
            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="border-t border-neutral-800 p-6 space-y-5">
                        {/* The full form from the original file */}
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                                {isFundraiser ? 'Tier Name' : 'Ticket Name'}
                            </label>
                            <input type="text" value={ticket.type} onChange={e => onUpdate(uiKey, 'type', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 px-4 text-white font-medium" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             {isFundraiser ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Suggested Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                                            <input type="number" value={ticket.price || ''} onChange={e => onUpdate(uiKey, 'price', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 pl-8 pr-4 text-white font-medium" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Minimum Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                                            <input type="number" value={ticket.minimumDonation || ''} onChange={e => onUpdate(uiKey, 'minimumDonation', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 pl-8 pr-4 text-white font-medium" />
                                        </div>
                                    </div>
                                </>
                             ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                                            <input type="number" value={ticket.price || ''} onChange={e => onUpdate(uiKey, 'price', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 pl-8 pr-4 text-white font-medium" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Capacity (Total Tickets)</label>
                                        <input type="number" placeholder="Unlimited" value={ticket.quantity || ''} onChange={e => onUpdate(uiKey, 'quantity', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 px-4 text-white font-medium" />
                                    </div>
                                </>
                             )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             {isFundraiser && (
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Capacity (Total Donations)</label>
                                    <input type="number" placeholder="Unlimited" value={ticket.quantity || ''} onChange={e => onUpdate(uiKey, 'quantity', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 px-4 text-white font-medium" />
                                </div>
                            )}
                            <div className={!isFundraiser ? "md:col-span-2" : ""}>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Sales End Date (Optional)</label>
                                <input type="datetime-local" value={formatDateForInput(ticket.saleEndDate)} onChange={e => onUpdate(uiKey, 'saleEndDate', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 px-4 text-white font-medium" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Description</label>
                            <textarea placeholder="Includes skip-the-line access, free drink, etc..." value={ticket.description || ''} onChange={e => onUpdate(uiKey, 'description', e.target.value)} rows={2} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 px-4 text-white font-medium resize-none" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const TicketEditor: React.FC<TicketEditorProps> = ({ tickets, onTicketsChange, isFundraiser = false }) => {
    const [wrappers, setWrappers] = useState<Wrapper[]>([]);
    const [expandedUiKey, setExpandedUiKey] = useState<string | null>(null);

    useEffect(() => {
        setWrappers(currentWrappers => {
            return tickets.map((ticket, index) => {
                // Find existing wrapper: 1. by stable ID, 2. by index for new items.
                let existing = ticket.id ? currentWrappers.find(w => w.data.id === ticket.id) : undefined;
                if (!existing && !ticket.id && currentWrappers[index] && !currentWrappers[index].data.id) {
                    existing = currentWrappers[index];
                }

                return {
                    data: ticket,
                    uiKey: existing?.uiKey || uuidv4() // Reuse uiKey if found, else generate new one
                };
            });
        });
    }, [tickets]);
    
    const updateParent = (newWrappers: Wrapper[]) => {
        const domainTickets = newWrappers.map(w => w.data);
        onTicketsChange(domainTickets);
    };

    const handleTicketChange = (key: string, field: keyof TicketOption, value: any) => {
        const newWrappers = wrappers.map(w => {
            if (w.uiKey === key) {
                const isNumericField = field === 'price' || field === 'minimumDonation' || field === 'quantity';
                let updatedValue = value;
                if (isNumericField && value !== '') {
                    updatedValue = parseFloat(value) || 0;
                } else if (isNumericField && value === '') {
                    updatedValue = undefined;
                }
                return { ...w, data: { ...w.data, [field]: updatedValue } };
            }
            return w;
        });
        updateParent(newWrappers);
    };

    const addTicket = () => {
        const newTicket: TicketOption = { 
            type: '', price: 0.00, description: '', 
            minimumDonation: 0, quantity: 100 
        };
        const newWrapper = { data: newTicket, uiKey: uuidv4() };
        updateParent([...wrappers, newWrapper]);
        setExpandedUiKey(newWrapper.uiKey);
    };

    const removeTicket = (keyToRemove: string) => {
        const newWrappers = wrappers.filter(w => w.uiKey !== keyToRemove);
        updateParent(newWrappers);
    };

    return (
        <div className="space-y-4">
            {wrappers.map((wrapper, index) => (
                <EditableTicketItem 
                    key={wrapper.uiKey}
                    ticket={wrapper.data}
                    uiKey={wrapper.uiKey}
                    isExpanded={expandedUiKey === wrapper.uiKey}
                    onToggle={() => setExpandedUiKey(expandedUiKey === wrapper.uiKey ? null : wrapper.uiKey)}
                    onUpdate={handleTicketChange}
                    onDelete={() => removeTicket(wrapper.uiKey)}
                    isFundraiser={isFundraiser}
                />
            ))}
            
            <button 
                onClick={addTicket} 
                className="w-full py-4 border-2 border-dashed border-neutral-800 hover:border-purple-500/50 rounded-2xl text-neutral-400 hover:text-purple-400 font-semibold transition-all duration-300 flex items-center justify-center gap-2 group"
            >
                <div className="bg-neutral-800 group-hover:bg-purple-500/20 p-1.5 rounded-full transition-colors">
                    <PlusIcon className="w-4 h-4" />
                </div>
                <span>Add {isFundraiser ? 'Donation Tier' : 'Ticket Type'}</span>
            </button>
        </div>
    );
};

export default TicketEditor;