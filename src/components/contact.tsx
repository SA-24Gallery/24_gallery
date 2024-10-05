"use client"

import { Icons } from "@/components/icons";
import Link from "next/link";

export default function Contact() {
    return (
        <footer className="bg-gray-100 py-8 dark:bg-gray-800">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">

                        <div className="flex items-center space-x-2">
                            <Icons.logo className="h-8 w-8" />
                            <span className="text-md font-semibold">24 Gallery</span>
                        </div>

                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Fast and Easy Online Photo Printing with 24 Gallery – Quality prints, quick service, and affordable prices, all starting from just 20 THB.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-md font-semibold">Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                    Home Page
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                    Registration Page
                                </Link>
                            </li>
                            <li>
                                <Link href="/oder" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                    Order Page
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-md font-semibold">Contact</h3>
                        <div className="flex flex-row gap-[10px] items-center">
                            <Icons.mail className="stroke-[1.2px] h-6 w-6" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                24gallery@gmail.com
                            </p>
                        </div>

                        <div className="flex flex-row gap-[10px] items-center">
                            <Icons.phone className="stroke-[1.2px] h-6 w-6" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                02 961 2146
                            </p>
                        </div>

                    </div>

                    <div className="space-y-4">
                        <h3 className="text-md font-semibold">Address</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Big C Extra Bangyai, Talingchan-Suphanburi Rd. Bang Rak Phatthana, Bang Bua Thong District, Nonthaburi 11110
                        </p>
                    </div>
                </div>
                <div
                    className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    &copy; 2024 24 Gallery. All rights reserved.
                </div>
            </div>
        </footer>
    )
}