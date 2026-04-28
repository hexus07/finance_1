
import { AlertCircle } from "lucide-react";

export function TradingPage() {
    return(
    <div className="p-8 space-y-8">
        {/* Demo Mode Banner */}
        <div className="bg-gradient-to-r from-[#fbbf24]/20 to-[#f59e0b]/20 border-2 border-[#fbbf24] rounded-2xl p-4">
            <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-[#fbbf24]" />
            <div>
                <p className="font-bold text-[#fbbf24] text-lg">UNDER CONSTRUCTION - WILL BE AVAILABLE AFTER MVP</p>
                <p className="text-sm text-muted-foreground">Practicing trading with virtual money</p>
            </div>
            </div>
        </div>
    </div>
    );
}