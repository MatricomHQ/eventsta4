
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AddOn } from '../types';
import { TrashIcon } from './Icons';

interface Wrapper {
    data: AddOn;
    uiKey: string;
}

interface AddOnEditorProps {
    addOns: AddOn[];
    onAddOnsChange: (addOns: AddOn[]) => void;
    isFundraiser?: boolean;
}

const AddOnEditor: React.FC<AddOnEditorProps> = ({ addOns, onAddOnsChange, isFundraiser = false }) => {
    const [wrappers, setWrappers] = useState<Wrapper[]>([]);

    useEffect(() => {
        setWrappers(currentWrappers => {
            return addOns.map((addOn, index) => {
                const existingKey = currentWrappers[index]?.uiKey || uuidv4();
                return {
                    data: addOn,
                    uiKey: existingKey
                };
            });
        });
    }, [addOns]);
    
    const updateParent = (newWrappers: Wrapper[]) => {
        // Map back to domain objects, preserving IDs if they exist.
        const domainAddOns = newWrappers.map(w => w.data);
        onAddOnsChange(domainAddOns);
    };

    const handleAddOnChange = (key: string, field: keyof AddOn, value: any) => {
        const newWrappers = wrappers.map(w => {
             if (w.uiKey === key) {
                const isNumericField = field === 'price' || field === 'minimumDonation';
                const updatedValue = isNumericField ? parseFloat(value) || 0 : value;
                return { 
                    ...w, 
                    data: { ...w.data, [field]: updatedValue } 
                };
            }
            return w;
        });
        updateParent(newWrappers);
    };

    const addAddOn = () => {
        // No ID tells backend to CREATE
        const newAddOn: AddOn = { name: '', price: 0.00, description: '', minimumDonation: 0 };
        const newWrapper = { data: newAddOn, uiKey: uuidv4() };
        updateParent([...wrappers, newWrapper]);
    };

    const removeAddOn = (indexToRemove: number) => {
        const newWrappers = wrappers.filter((_, index) => index !== indexToRemove);
        updateParent(newWrappers);
    };

    return (
        <div className="space-y-4">
            {wrappers.map((wrapper, index) => {
                const addOn = wrapper.data;
                return (
                    <div key={wrapper.uiKey} className="bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-semibold text-white">
                                {isFundraiser ? 'Donation Add-on' : 'Add-on Option'} #{index + 1}
                                {addOn.id && <span className="ml-2 text-[10px] text-neutral-500 font-mono">ID: {addOn.id.split('-').pop()}</span>}
                            </h4>
                            <button onClick={() => removeAddOn(index)} className="text-red-500 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                type="text" 
                                placeholder="Add-on Name (e.g., VIP Access)" 
                                value={addOn.name} 
                                onChange={e => handleAddOnChange(wrapper.uiKey, 'name', e.target.value)} 
                                className="w-full h-10 px-4 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500" 
                            />
                            <input 
                                type="number" 
                                placeholder={isFundraiser ? 'Recommended Donation' : 'Price'}
                                value={addOn.price} 
                                onChange={e => handleAddOnChange(wrapper.uiKey, 'price', e.target.value)} 
                                className="w-full h-10 px-4 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                step="0.01"
                                min="0"
                            />
                        </div>
                        {isFundraiser && (
                             <div className="mt-4">
                                 <input 
                                    type="number" 
                                    placeholder="Minimum Donation" 
                                    value={addOn.minimumDonation || ''}
                                    onChange={e => handleAddOnChange(wrapper.uiKey, 'minimumDonation', e.target.value)} 
                                    className="w-full md:w-1/2 h-10 px-4 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    step="0.01"
                                    min="0"
                                />
                             </div>
                        )}
                         <textarea 
                            placeholder="Optional description..." 
                            value={addOn.description || ''} 
                            onChange={e => handleAddOnChange(wrapper.uiKey, 'description', e.target.value)} 
                            rows={2} 
                            className="w-full mt-4 p-3 bg-neutral-700 border border-neutral-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" 
                        />
                    </div>
                );
            })}
            <button onClick={addAddOn} className="w-full mt-2 px-5 py-3 text-sm font-semibold text-purple-400 hover:text-white transition-colors bg-purple-500/10 hover:bg-purple-500/20 rounded-lg">Add Add-on</button>
        </div>
    );
};

export default AddOnEditor;
