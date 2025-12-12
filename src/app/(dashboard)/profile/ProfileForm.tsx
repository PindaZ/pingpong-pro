"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Save, Loader2, Camera, Upload } from "lucide-react";

interface ProfileFormProps {
    user: {
        id: string;
        name: string | null;
        bio: string | null;
        avatarUrl: string | null;
    };
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user.name || "");
    const [bio, setBio] = useState(user.bio || "");
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(user.avatarUrl);
    const [error, setError] = useState("");

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError("");

        try {
            let currentAvatarUrl = avatarUrl; // Default to existing

            // Upload image if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    throw new Error("Failed to upload image");
                }

                const uploadData = await uploadRes.json();
                currentAvatarUrl = uploadData.url;
            }

            // Update profile
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, bio, avatarUrl: currentAvatarUrl }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to update profile");
            } else {
                setEditing(false);
                setAvatarUrl(currentAvatarUrl);
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Edit2 size={18} className="text-indigo-400" />
                    Edit Profile
                </h4>
                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                        Edit
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            setEditing(false);
                            setName(user.name || "");
                            setBio(user.bio || "");
                            setPreviewUrl(user.avatarUrl);
                            setSelectedFile(null);
                        }}
                        className="text-sm text-slate-400 hover:text-slate-300 font-medium"
                    >
                        Cancel
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-6">
                {/* Avatar Upload Section */}
                {editing && (
                    <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-full bg-slate-800 overflow-hidden ring-2 ring-slate-700">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    <Camera size={24} />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700">
                                <Upload size={14} />
                                <span>Change Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                            <p className="text-xs text-slate-500 mt-1">Recommended: Square JPG, PNG</p>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                        Display Name
                    </label>
                    {editing ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Your display name"
                        />
                    ) : (
                        <p className="text-white py-2">{name || "Not set"}</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                        Bio
                    </label>
                    {editing ? (
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Tell others about yourself..."
                        />
                    ) : (
                        <p className="text-white py-2">{bio || "No bio yet"}</p>
                    )}
                </div>

                {editing && (
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Changes
                    </button>
                )}
            </div>
        </div>
    );
}
