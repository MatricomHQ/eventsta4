
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TicketOption } from '../types';
import { TrashIcon } from './Icons';

interface Wrapper {
    data: TicketOption;
    uiKey: string;
}

interface TicketEditorProps {
    tickets: TicketOption[];
    onTicketsChange: (tickets: TicketOption[]) => void;
    isFundraiser?: boolean;
}

const TicketEditor: React.FC<TicketEditorProps> = ({ tickets, onTicketsChange, isFundraiser = false }) => {
    // We use a wrapper to maintain stable keys for UI inputs, 
    // while keeping data separated to properly preserve/omit backend IDs.
    const [wrappers, setWrappers] = useState<Wrapper[]>([]);

    useEffect(() => {
        setWrappers(currentWrappers => {
            // Re-sync with props, but preserve keys if index matches to avoid input focus loss
            return tickets.map((ticket, index) => {
                const existingKey = currentWrappers[index]?.uiKey || uuidv4();
                return {
                    data: ticket,
                    uiKey: existingKey
                };
            });
        });
    }, [tickets]);
    
    const updateParent = (newWrappers: Wrapper[]) => {
        // Map back to domain objects.
        // CRITICAL: We preserve the 'id' field if it exists in the data. 
        // We do NOT add the 'uiKey' to the domain object.
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
                return { 
                    ...w, 
                    data: { ...w.data, [field]: updatedValue } 
                };
            }
            return w;
        });
        updateParent(newWrappers);
    };

    const addTicket = () => {
        const newTicket: TicketOption = { 
            type: '', 
            price: 0.00, 
            description: '', 
            minimumDonation: 0, 
            quantity: 100 
            // NOTE: No ID is added here. This tells backend to CREATE.
        };
        const newWrapper = { data: newTicket, uiKey: uuidv4() };
        updateParent([...wrappers, newWrapper]);
    };

    const removeTicket = (indexToRemove: number) => {
        const newWrappers = wrappers.filter((_, index) => index !== indexToRemove);
        updateParent(newWrappers);
    };

    // Format Date for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (isoString?: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    };

    return (
        <div className="space-y-4">
            {wrappers.map((wrapper, index) => {
                const ticket = wrapper.data;
                const soldCount = ticket.sold || 0;
                const maxCount = ticket.quantity || 0;
                const percentage = maxCount > 0 ? Math.min((soldCount / maxCount) * 100, 100) : 0;

                return (
                    <div key={wrapper.uiKey} className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-semibold text-white flex items-center gap-2">
                                {isFundraiser ? 'Donation Tier' : 'Ticket Option'} #{index + 1}
                                {maxCount > 0 && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${percentage >= 100 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                                        {percentage >= 100 ? 'SOLD OUT' : 'Active'}
                                    </span>
                                )}
                                {ticket.id && <span className="text-[10px] text-neutral-500 font-mono">ID: {ticket.id.split('-').pop()}</span>}
                            </h4>
                            {wrappers.length > 1 && (
                                <button onClick={() => removeTicket(index)} className="text-red-500 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                            )}
                        </div>
                        
                        {/* Main Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input 
                                type="text" 
                                placeholder={isFundraiser ? 'Tier Name (e.g., Art Patron)' : 'Ticket Type (e.g., VIP)'}
                                value={ticket.type} 
                                onChange={e => handleTicketChange(wrapper.uiKey, 'type', e.target.value)} 
                                className="w-full h-10 px-4 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500" 
                            />
                            <input 
                                type="number" 
                                placeholder={isFundraiser ? 'Recommended Donation' : 'Price'}
                                value={ticket.price} 
                                onChange={e => handleTicketChange(wrapper.uiKey, 'price', e.target.value)} 
                                className="w-full h-10 px-4 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                step="0.01"
                                min="0"
                            />
                        </div>

                        {/* Inventory & Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-xs text-neutral-400 uppercase font-bold mb-1 block">Total Quantity (Capacity)</label>
                                <input 
                                    type="number" 
                                    placeholder="Unlimited"
                                    value={ticket.quantity || ''}
                                    onChange={e => handleTicketChange(wrapper.uiKey, 'quantity', e.target.value)}
                                    className="w-full h-10 px-4 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-neutral-400 uppercase font-bold mb-1 block">Sales End Date (Optional)</label>
                                <input 
                                    type="datetime-local"
                                    value={formatDateForInput(ticket.saleEndDate)}
                                    onChange={e => handleTicketChange(wrapper.uiKey, 'saleEndDate', e.target.value)}
                                    className="w-full h-10 px-4 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        {/* Sales Progress Bar (Admin Only View) */}
                        {maxCount > 0 && (
                            <div className="mb-4 bg-neutral-900/50 p-3 rounded-lg border border-neutral-700/50">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-neutral-400">Sales Progress</span>
                                    <span className="text-white font-mono">{soldCount} / {maxCount} Sold</span>
                                </div>
                                <div className="w-full h-2 bg-neutral-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all ${percentage >= 100 ? 'bg-red-500' : 'bg-purple-500'}`} 
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {isFundraiser && (
                             <div className="mt-4">
                                 <input 
                                    type="number" 
                                    placeholder="Minimum Donation" 
                                    value={ticket.minimumDonation || ''}
                                    onChange={e => handleTicketChange(wrapper.uiKey, 'minimumDonation', e.target.value)} 
                                    className="w-full md:w-1/2 h-10 px-4 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    step="0.01"
                                    min="0"
                                />
                             </div>
                        )}
                         <textarea 
                            placeholder="Optional description..." 
                            value={ticket.description || ''} 
                            onChange={e => handleTicketChange(wrapper.uiKey, 'description', e.target.value)} 
                            rows={2} 
                            className="w-full mt-0 p-3 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" 
                        />
                    </div>
                );
            })}
            <button onClick={addTicket} className="w-full mt-2 px-5 py-3 text-sm font-semibold text-purple-400 hover:text-white transition-colors bg-purple-500/10 hover:bg-purple-500/20 rounded-lg">
                Add {isFundraiser ? 'Donation Tier' : 'Ticket Type'}
            </button>
        </div>
    );
};

export default TicketEditor;
