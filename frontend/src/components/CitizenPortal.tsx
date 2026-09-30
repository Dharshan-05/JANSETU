import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  MapPin, 
  Clock, 
  Users,
  Flame,
  Volume2,
  Radio
} from 'lucide-react';
import { submitTextRequest, submitVoiceRequest } from '../lib/api';
import { IntakeResponse } from '../types';

export const CitizenPortal: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'ta' | 'hi' | 'te' | 'en'>('ta');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioTimer, setAudioTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = {
    ta: {
      label: 'Tamil (தமிழ்) - Harur Bus Service Gap',
      text: 'எங்கள் கிராமத்திற்கு மாலை 7 மணிக்கு பிறகு பேருந்து வசதி இல்லை, பள்ளி மாணவர்கள் மிகவும் சிரமப்படுகின்றனர்.',
      state: 'Tamil Nadu',
      district: 'Dharmapuri'
    },
    hi: {
      label: 'Hindi (हिन्दी) - Pindra Drinking Water Crisis',
      text: 'हमारे ब्लॉक में पिछले तीन हफ्तों से पीने के पानी की आपूर्ति पूरी तरह ठप है, अस्पताल और बच्चे परेशान हैं।',
      state: 'Uttar Pradesh',
      district: 'Varanasi'
    },
    te: {
      label: 'Telugu (తెలుగు) - Jadcherla PHC Doctor Shortage',
      text: 'మా గ్రామంలో ప్రాథమిక ఆరోగ్య కేంద్రంలో వైద్యులు అందుబాటులో లేరు, అత్యవసర సమయాల్లో తీవ్ర ఇబ్బందులు పడుతున్నాము.',
      state: 'Telangana',
      district: 'Mahabubnagar'
    },
    en: {
      label: 'English - Rural Arterial Road Damage',
      text: 'The primary arterial connecting road between our panchayat and the state highway has severe crater-sized potholes, restricting school buses.',
      state: 'Tamil Nadu',
      district: 'Dharmapuri'
    }
  };

  const handleSelectSample = (lang: 'ta' | 'hi' | 'te' | 'en') => {
    setSelectedLang(lang);
    setTextInput(samplePrompts[lang].text);
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const activeSample = samplePrompts[selectedLang];
      const res = await submitTextRequest({
        text: textInput,
        detected_language: selectedLang,
        declared_state: activeSample.state,
        declared_district: activeSample.district
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to submit citizen request.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceRecordToggle = async () => {
    if (isRecording) {
      // Stop recording and process
      setIsRecording(false);
      setLoading(true);
      setError(null);

      try {
        // Create synthetic WAV payload for multi-dialect evaluation
        const dummyBlob = new Blob([new Uint8Array(44)], { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio_file', dummyBlob, 'citizen_recording.wav');
        formData.append('declared_language', selectedLang);
        formData.append('source_channel', 'voice_web');
        formData.append('declared_state', samplePrompts[selectedLang].state);
        formData.append('declared_district', samplePrompts[selectedLang].district);

        const res = await submitVoiceRequest(formData);
        setResult(res);
        setTextInput(res.original_text);
      } catch (err: any) {
        setError(err.message || 'Speech-to-Text inference failed.');
      } finally {
        setLoading(false);
        setAudioTimer(0);
      }
    } else {
      // Start recording
      setIsRecording(true);
      setAudioTimer(3);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-[#FF6500]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#FF6500] animate-pulse" />
              Multilingual Citizen Voice & Intake Grid
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Citizens can articulate infrastructure gaps in their native mother tongue via audio voice recordings or text. 
              The pipeline normalizes through Google Speech-to-Text (Chirp 2) and extracts typed infrastructure parameters via Gemini 2.5.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['ta', 'hi', 'te', 'en'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleSelectSample(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                  selectedLang === lang
                    ? 'bg-[#FF6500] text-white shadow-md shadow-orange-500/20'
                    : 'bg-[#1E3E62]/40 text-slate-300 hover:bg-[#1E3E62]'
                }`}
              >
                {lang === 'ta' ? 'தமிழ்' : lang === 'hi' ? 'हिन्दी' : lang === 'te' ? 'తెలుగు' : 'English'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice Recorder & Text Input */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Citizen Audio Intake</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
                STT CHIRP-2 READY
              </span>
            </h3>

            {/* Voice Recording Widget */}
            <div className="bg-[#070F1E] rounded-xl p-6 border border-[#1E3E62] flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <button
                  type="button"
                  onClick={handleVoiceRecordToggle}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-500/30' 
                      : 'bg-gradient-to-tr from-[#FF6500] to-[#FF9933] hover:scale-105 shadow-lg shadow-orange-500/30'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-white text-sm">
                  {isRecording ? 'Listening in ' + (selectedLang === 'ta' ? 'Tamil' : selectedLang === 'hi' ? 'Hindi' : selectedLang === 'te' ? 'Telugu' : 'English') + '...' : 'Click to Speak Infrastructure Request'}
                </p>
                <p className="text-xs text-slate-400">
                  {isRecording ? 'Speak clearly into your microphone' : 'Supported Dialects: Tamil, Hindi, Telugu, Kannada, English'}
                </p>
              </div>

              {isRecording && (
                <div className="mt-4 flex items-center gap-1.5 text-xs text-red-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                  <span>RECORDING ACTIVE • 00:0{audioTimer}</span>
                </div>
              )}
            </div>

            {/* Quick Benchmark Prompts */}
            <div className="mt-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Demonstration Scenarios:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {(['ta', 'hi', 'te', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleSelectSample(lang)}
                    className={`text-left text-xs p-2.5 rounded-lg border transition-all ${
                      selectedLang === lang
                        ? 'bg-[#1E3E62]/70 border-[#FF6500] text-white'
                        : 'bg-[#0B192C]/40 border-[#1E3E62]/40 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span className="font-semibold text-orange-400 block mb-0.5">
                      {samplePrompts[lang].label}
                    </span>
                    <span className="text-slate-300 line-clamp-1 italic">
                      "{samplePrompts[lang].text}"
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Or Text Form */}
            <form onSubmit={handleTextSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Or Type Text in Any Indian Script:
                </label>
                <textarea
                  rows={3}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter citizen infrastructure feedback here..."
                  className="w-full bg-[#070F1E] border border-[#1E3E62] rounded-lg p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#FF6500]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !textInput.trim()}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#FF6500] to-[#E55604] hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Gemini 2.5 Neural Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit to Civic Intelligence Grid</span>
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-950/40 border border-red-800/40 rounded-lg text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Perception & Gemini Structured Intelligence */}
        <div className="lg:col-span-6 space-y-4">
          <div className="glass-panel rounded-xl p-6 min-h-[500px]">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Gemini 2.5 Structured Perception Output
              </span>
              {result && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono font-bold">
                  {result.processing_time_ms} ms
                </span>
              )}
            </h3>

            {!result && !loading && (
              <div className="h-80 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Volume2 className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-400">Awaiting Citizen Input</p>
                <p className="text-xs max-w-sm mt-1">
                  Speak into the microphone or submit a demonstration request in Tamil, Hindi, Telugu, or English.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-80 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">Executing Perception Flow</p>
                  <p className="text-xs text-slate-400 font-mono">
                    STT Normalization → Gemini Typed JSON Extraction → Vector Embedding → BigQuery Fusion
                  </p>
                </div>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Perception & Translation Box */}
                <div className="p-4 bg-[#070F1E] rounded-lg border border-[#1E3E62] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">
                      Transcribed & Normalized Speech
                    </span>
                    <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                      Lang: {result.detected_language.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium italic">
                    "{result.original_text}"
                  </p>
                  <div className="pt-2 border-t border-[#1E3E62]/40">
                    <span className="text-[11px] text-slate-400 font-semibold block mb-0.5">
                      Normalized English Semantic Pivot:
                    </span>
                    <p className="text-xs text-orange-200">
                      "{result.english_translation}"
                    </p>
                  </div>
                </div>

                {/* Structured Extraction Matrix */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62]">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">
                      Primary Sector
                    </span>
                    <span className="font-bold text-orange-400 text-sm uppercase">
                      {result.extraction.primary_category}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Sub: {result.extraction.subcategory.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62]">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1">
                      Severity & Urgency
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                        result.extraction.severity >= 4 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        Level {result.extraction.severity} / 5
                      </span>
                      <span className="font-mono text-slate-300">
                        Urgency: {Math.round(result.extraction.urgency_score * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62]">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-400" />
                      Affected Demographic Cohort
                    </span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {result.extraction.affected_group.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62]">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      Temporal Recurrence
                    </span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {result.extraction.time_pattern.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Spatial Resolution */}
                <div className="p-3 bg-[#0B192C] rounded-lg border border-[#1E3E62] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        Matched Administrative Area
                      </span>
                      <span className="font-semibold text-slate-100">
                        {result.matched_admin_area}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] bg-slate-800 text-slate-300 px-2 py-1 rounded">
                    LGD: {result.matched_geo_id}
                  </span>
                </div>

                {/* Request Fusion & Semantic Clustering Result */}
                <div className="p-4 bg-gradient-to-r from-orange-950/30 to-[#0B192C] rounded-lg border border-orange-500/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-orange-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-orange-400" />
                      Request Fusion & Semantic Cluster Assigned
                    </span>
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-mono font-bold">
                      {result.assigned_cluster_id}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">
                    {result.cluster_title}
                  </p>
                  <p className="text-xs text-slate-300">
                    This request was automatically fused with related community reports using 768-dim multilingual vector similarity in BigQuery.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
