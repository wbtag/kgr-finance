"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <DesktopNavigation />
            <MobileNavigation onClick={() => setOpen(!open)} open={open} setOpen={setOpen} />
        </>
    );
}

function MobileNavigation({ onClick, open, setOpen }) {
    const path = usePathname();

    if (path.includes("login")) {
        return null;
    }

    return (
        <>
            <div className="md:hidden">
                <button onClick={onClick} className="p-4">
                    <Menu size={24} />
                </button>
                <aside
                    className={`absolute z-50 left-0 top-0 w-full h-full pl-8 pt-4 pr-2 bg-[#09002f]
                                transform transition-transform duration-300
                                 ${open ? "translate-x-0" : "-translate-x-full"}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex flex-row items-center pb-2">
                        <h2 className="text-xl font-semibold w-100">Finanční portál rodiny Gregerovy</h2>
                        <div className="flex justify-end">
                            <button onClick={() => setOpen(false)} className="p-2">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    <ul className="flex flex-col gap-4 text-lg">
                        <li><Link href="/" onClick={() => setOpen(false)}>Přehled</Link></li>
                        <li><Link href="/receipt" onClick={() => setOpen(false)}>Nová útrata</Link></li>
                        <li><Link href="/query" onClick={() => setOpen(false)}>Detail útrat</Link></li>
                        <li><Link href="/balance" onClick={() => setOpen(false)}>Zůstatek</Link></li>
                    </ul>
                </aside>
            </div>
        </>
    )
}

function DesktopNavigation() {

    const path = usePathname();

    if (path.includes("login")) {
        return null;
    }

    return (
        <>
            <nav className="hidden md:flex items-center p-4 shadow border-b-1">
                <h1 className="text-xl font-semibold pl-6 pr-2">Finanční portál rodiny Gregerovy</h1>
                <ul className="flex gap-10 pl-20">
                    <li><Link href="/">Přehled</Link></li>
                    <li><Link href="/receipt">Nová útrata</Link></li>
                    <li><Link href="/query">Detail útrat</Link></li>
                    <li><Link href="/balance">Zůstatek</Link></li>
                </ul>
            </nav>
        </>
    )
}
