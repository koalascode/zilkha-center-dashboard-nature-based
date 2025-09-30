"use client";
import { useEffect, useState } from "react";
import { Label } from "../Label";

import {
Accordion,
AccordionContent,
AccordionItem,
AccordionTrigger,
} from '@/components/Accordion';

export default function DeviceList() {
    const [devices, setDevices] = useState('[]');
        useEffect(() => {
            async function getData() {
                const res = await fetch('/api/devices', new Request(''));
                const data = await res.json();
                setDevices(JSON.stringify(data));
            }
            getData();
        }, []);
    return (
        <div>
            <Accordion type="single" className="mx-auto mt-3 max-w-sm" collapsible>
                {JSON.parse(devices).map((record: any) => {
                    return <AccordionItem value={record.sensor.number}>
                    <AccordionTrigger className="font-semibold">{record.sensor.name}</AccordionTrigger>
                    <AccordionContent>
                        <ol className="flex flex-col gap-2">
                            {record.registers.map((register: any) => {
                                return <li>
                                    {register.name}
                                </li>
                            })}
                        </ol>
                    </AccordionContent>
                    </AccordionItem>
                    }
                )}
            </Accordion>
            {/* <ul className="ms-1 flex flex-col gap-3">
                
            </ul> */}
        </div>
    );
}