"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState } from "react";

export default function StudentServicesPage() {
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState("services");
  const [feedbackType, setFeedbackType] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const services = [
    {
      id: 1,
      name: "Study Skills & Learning Support",
      description: "Get help with time management, study techniques, note-taking strategies, and effective online learning methods.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      email: "bc220212371iul@vu.edu.pk",
      whatsappGroup: "https://chat.whatsapp.com/GlNCPmlQNk65sZQzkqBEEX",
      chatGroup: "https://chat.google.com/room/AAQA3s3QunE?cls=1"
    },
    {
      id: 2,
      name: "Computer & PC Technical Support",
      description: "Get help with laptop/PC issues, software problems, internet connectivity, and technical difficulties affecting your online studies.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      email: "bc220212371iul@vu.edu.pk",
      whatsappGroup: "https://chat.whatsapp.com/GlNCPmlQNk65sZQzkqBEEX",
      chatGroup: "https://chat.google.com/room/AAQAZ_JLWhc?cls=1"
    },
    {
      id: 3,
      name: "Career Guidance for VU Students",
      description: "Get advice on career choices, job opportunities after VU, industry trends, and how to prepare for your future career while studying.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
        </svg>
      ),
      email: "bc220212371iul@vu.edu.pk",
      whatsappGroup: "https://chat.whatsapp.com/GlNCPmlQNk65sZQzkqBEEX",
      chatGroup: "https://chat.google.com/room/AAQADl1_G0k?cls=1"
    }
  ];

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackType || !feedbackText || rating === 0) {
      alert("Please fill in all fields and provide a rating.");
      return;
    }

    setSubmitting(true);
    try {
      // Here you would typically send the feedback to your backend/admin panel
      // For now, we'll just simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("Thank you for your feedback! It has been sent to the admin.");
      setFeedbackType("");
      setFeedbackText("");
      setRating(0);
    } catch (error) {
      alert("Error submitting feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setRating(star)}
        className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition`}
      >
        ★
      </button>
    ));
  };

  return (
    <DashboardLayout currentPage="/student-services">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Student Services</h1>
          <p style={{ color: 'hsl(var(--muted-foreground))' }}>Access all the support services and resources available to help you succeed.</p>
        </div>

        {/* Tab Navigation */}
        <div className="rounded-lg shadow-sm p-6 mb-6" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="flex space-x-8" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
            <button
              onClick={() => setActiveTab("services")}
              className="pb-2 px-1 border-b-2 font-medium text-sm transition"
              style={{
                borderBottomColor: activeTab === "services" ? 'hsl(var(--primary))' : 'transparent',
                color: activeTab === "services" ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
              }}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className="pb-2 px-1 border-b-2 font-medium text-sm transition"
              style={{
                borderBottomColor: activeTab === "feedback" ? 'hsl(var(--primary))' : 'transparent',
                color: activeTab === "feedback" ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'
              }}
            >
              Feedback & Bug Report
            </button>
          </div>
        </div>

        {activeTab === "services" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services List */}
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className="rounded-lg shadow-sm p-6 cursor-pointer transition hover:shadow-md"
                  style={{
                    backgroundColor: selectedService?.id === service.id ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--card))',
                    border: selectedService?.id === service.id ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border))'
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>{service.name}</h3>
                      <p className="mb-3" style={{ color: 'hsl(var(--muted-foreground))' }}>{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Details */}
            <div className="lg:col-span-1">
              {selectedService ? (
                <div className="rounded-lg shadow-sm p-6 sticky top-6" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                      {selectedService.icon}
                    </div>
                    <h2 className="text-xl font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>{selectedService.name}</h2>
                  </div>
                  
                  <p className="mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>{selectedService.description}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-3" style={{ color: 'hsl(var(--card-foreground))' }}>Contact Information</h3>
                      <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'hsl(var(--muted-foreground))' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <a href={`mailto:${selectedService.email}`} className="hover:opacity-80 transition" style={{ color: 'hsl(var(--primary))' }}>
                              {selectedService.email}
                            </a>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                            <a href={selectedService.whatsappGroup} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">
                              Student Support WhatsApp Group
                            </a>
                          </div>

                          <div className="flex items-center text-sm">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'hsl(var(--primary))' }}>
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <a href={selectedService.chatGroup} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition" style={{ color: 'hsl(var(--primary))' }}>
                              Google Chat Group
                            </a>
                          </div>
                        
                        <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                           <div className="flex items-start space-x-3">
                             <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'hsl(var(--primary))' }}>
                               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                             </svg>
                             <div className="flex-1">
                               <h4 className="font-medium mb-2" style={{ color: 'hsl(var(--primary))' }}>How to Join Google Chat Group:</h4>
                                <div className="rounded p-3 mb-3" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.3)' }}>
                                  <p className="text-sm font-bold" style={{ color: 'hsl(var(--primary))' }}>⚠️ IMPORTANT: VU email required for Google Chat groups. Non-VU email users must send email with subject and name only.</p>
                                </div>
                               <div className="mb-3">
                                  <h5 className="font-medium mb-1" style={{ color: 'hsl(var(--primary))' }}>For VU Email Users:</h5>
                                  <ol className="text-sm space-y-1 list-decimal list-inside ml-2" style={{ color: 'hsl(var(--card-foreground))' }}>
                                    <li>You can join directly, Make sure you're signed in to Google with your <strong>VU email (@vu.edu.pk)</strong></li>
                                  </ol>
                                </div>
                                <div className="mb-3">
                                  <h5 className="font-medium mb-1" style={{ color: 'hsl(var(--primary))' }}>For Non-VU Email Users:</h5>
                                  <ol className="text-sm space-y-1 list-decimal list-inside ml-2" style={{ color: 'hsl(var(--card-foreground))' }}>
                                    <li>Send an email to <strong>{selectedService.email}</strong></li>
                                    <li>Subject: "Request to join {selectedService.name} group"</li>
                                    <li>Include only your full name in the email</li>
                                    <li>Wait for invitation to be sent to your email</li>
                                  </ol>
                                </div>
                                <p className="text-xs mt-2 italic" style={{ color: 'hsl(var(--muted-foreground))' }}>Note: Direct links won't work without proper invitation.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center h-64">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500">Select a service to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "feedback" && (
          <div className="rounded-lg shadow-sm p-6" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--card-foreground))' }}>Feedback & Bug Report</h2>
            <p className="mb-6" style={{ color: 'hsl(var(--muted-foreground))' }}>Help us improve by sharing your feedback or reporting any bugs you encounter.</p>
            
            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
                  Type of Feedback
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    '--tw-ring-color': 'hsl(var(--primary))'
                  }}
                  required
                >
                  <option value="">Select feedback type</option>
                  <option value="bug">Bug Report</option>
                  <option value="feedback">General Feedback</option>
                  <option value="suggestion">Suggestion</option>
                  <option value="compliment">Compliment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
                  Your Message
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    '--tw-ring-color': 'hsl(var(--primary))'
                  }}
                  placeholder="Please describe your feedback or bug report in detail..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--card-foreground))' }}>
                  Rating (1-5 stars)
                </label>
                <div className="flex space-x-1">
                  {renderStars()}
                </div>
                <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Rate your overall experience with the app</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  Your feedback will be sent to: <span className="font-medium">bc220212371iul@vu.edu.pk</span>
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition hover:opacity-90"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}