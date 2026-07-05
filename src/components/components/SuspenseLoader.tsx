import { LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";

const SuspenseLoader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950">
            <div className="w-full max-w-xs px-6">
                <div className="flex items-center justify-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    >
                        <LoaderCircle className="h-10 w-10 text-orange-500" />
                    </motion.div>

                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Divyam
                        </h1>
                        <p className="text-sm text-slate-400">
                            Loading dashboard...
                        </p>
                    </div>
                </div>

                <div className="mt-6 h-1 overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                        className="h-full rounded-full bg-orange-500"
                        animate={{
                            x: ["-100%", "300%"],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SuspenseLoader;