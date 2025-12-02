import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AddOn } from '../types';
import { TrashIcon, PlusIcon, GripVerticalIcon, ChevronDownIcon } from './Icons';

interface Wrapper {
    data: AddOn;
    uiKey: string;
}

interface AddOnEditorProps {
    addOns: AddOn[];
    onAddOnsChange: (addOns: AddOn[]) => void;
    isFundraiser?: boolean;
}

const EditableAddOnItem: React.FC<{
    addOn: AddOn,
    uiKey: string,
    isExpanded: boolean,
    onToggle: () => void,
    onUpdate: (key: string, field: keyof AddOn, value: any) => void,
    onDelete: () => void,
    isFundraiser: boolean,
    index: number;
    onDragStart: (index: number) => void;
    onDragEnter: (index: number) => void;
    onDragEnd: () => void;
    isDragging: boolean;
}> = ({ addOn, uiKey, isExpanded, onToggle, onUpdate, onDelete, isFundraiser, index, onDragStart, onDragEnter, onDragEnd, isDragging }) => {
    
    return (
        <div 
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`bg-neutral-900 border rounded-2xl transition-all duration-300 group ${isExpanded ? 'border-purple-500 shadow-lg shadow-purple-500/10' : 'border-neutral-800 hover:border-neutral-700'} ${isDragging ? 'opacity-50 scale-105 shadow-2xl shadow-purple-500/20' : 'opacity-100'}`}>
            {/* --- Summary View (Header) --- */}
            <div 
                className="flex items-center p-4 cursor-pointer"
                onClick={onToggle}
            >
                <div className="text-neutral-500 cursor-grab p-2 -ml-2"><GripVerticalIcon className="w-5 h-5"/></div>
                
                <div className="flex-grow mx-4">
                    <h4 className="font-bold text-white truncate">{addOn.name || 'Untitled Add-on'}</h4>
                    <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1">
                        <span>{isFundraiser ? 'Suggested: ' : 'Price: '}<span className="font-mono font-semibold">${(addOn.price || 0).toFixed(2)}</span></span>
                        {isFundraiser && <span>Min: <span className="font-mono font-semibold">${(addOn.minimumDonation || 0).toFixed(2)}</span></span>}
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
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Add-on Name</label>
                            <input type="text" value={addOn.name} onChange={e => onUpdate(uiKey, 'name', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 px-4 text-white font-medium" />
                        </div>
                        {isFundraiser ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Recommended Amount</label>
                                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span><input type="number" value={addOn.price} onChange={e => onUpdate(uiKey, 'price', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 pl-8 pr-4 text-white font-medium" /></div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Minimum Required</label>
                                    <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span><input type="number" value={addOn.minimumDonation || ''} onChange={e => onUpdate(uiKey, 'minimumDonation', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 pl-8 pr-4 text-white font-medium" /></div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Price</label>
                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span><input type="number" value={addOn.price} onChange={e => onUpdate(uiKey, 'price', e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 pl-8 pr-4 text-white font-medium" /></div>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Description (Optional)</label>
                            <textarea value={addOn.description || ''} onChange={e => onUpdate(uiKey, 'description', e.target.value)} rows={2} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg py-3 px-4 text-white font-medium resize-none" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddOnEditor: React.FC<AddOnEditorProps> = ({ addOns, onAddOnsChange, isFundraiser = false }) => {
    const [wrappers, setWrappers] = useState<Wrapper[]>([]);
    const [expandedUiKey, setExpandedUiKey] = useState<string | null>(null);
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        setWrappers(currentWrappers => {
            return (addOns || []).map((addOn, index) => {
                // Find existing wrapper: 1. by stable ID, 2. by index for new items.
                let existing = addOn.id ? currentWrappers.find(w => w.data.id === addOn.id) : undefined;
                if (!existing && !addOn.id && currentWrappers[index] && !currentWrappers[index].data.id) {
                    existing = currentWrappers[index];
                }

                return {
                    data: addOn,
                    uiKey: existing?.uiKey || uuidv4() // Reuse uiKey if found, else generate new one
                };
            });
        });
    }, [addOns]);
    
    const updateParent = (newWrappers: Wrapper[]) => {
        const domainAddOns = newWrappers.map(w => w.data);
        onAddOnsChange(domainAddOns);
    };

    const handleDragStart = (index: number) => {
        dragItem.current = index;
        setDraggingIndex(index);
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };
    
    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const newWrappers = [...wrappers];
            const draggedItemContent = newWrappers.splice(dragItem.current, 1)[0];
            newWrappers.splice(dragOverItem.current, 0, draggedItemContent);
            updateParent(newWrappers);
        }
        setDraggingIndex(null);
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleAddOnChange = (key: string, field: keyof AddOn, value: any) => {
        const newWrappers = wrappers.map(w => {
            if (w.uiKey === key) {
                const isNumericField = field === 'price' || field === 'minimumDonation';
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

    const addAddOn = () => {
        const newAddOn: AddOn = { name: '', price: 0.00, description: '', minimumDonation: 0 };
        const newWrapper = { data: newAddOn, uiKey: uuidv4() };
        updateParent([...wrappers, newWrapper]);
        setExpandedUiKey(newWrapper.uiKey);
    };

    const removeAddOn = (keyToRemove: string) => {
        const newWrappers = wrappers.filter(w => w.uiKey !== keyToRemove);
        updateParent(newWrappers);
    };

    return (
        <div className="space-y-4">
            {wrappers.map((wrapper, index) => (
                <EditableAddOnItem
                    key={wrapper.uiKey}
                    addOn={wrapper.data}
                    uiKey={wrapper.uiKey}
                    isExpanded={expandedUiKey === wrapper.uiKey}
                    onToggle={() => setExpandedUiKey(expandedUiKey === wrapper.uiKey ? null : wrapper.uiKey)}
                    onUpdate={handleAddOnChange}
                    onDelete={() => removeAddOn(wrapper.uiKey)}
                    isFundraiser={isFundraiser}
                    index={index}
                    onDragStart={handleDragStart}
                    onDragEnter={handleDragEnter}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingIndex === index}
                />
            ))}
            
            <button 
                onClick={addAddOn} 
                className="w-full py-4 border-2 border-dashed border-neutral-800 hover:border-purple-500/50 rounded-2xl text-neutral-400 hover:text-purple-400 font-semibold transition-all duration-300 flex items-center justify-center gap-2 group"
            >
                <div className="bg-neutral-800 group-hover:bg-purple-500/20 p-1.5 rounded-full transition-colors">
                    <PlusIcon className="w-4 h-4" />
                </div>
                <span>Add Add-on</span>
            </button>
        </div>
    );
};

export default AddOnEditor;