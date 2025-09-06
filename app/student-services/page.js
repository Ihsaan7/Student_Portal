"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState } from "react";

export default function StudentServicesPage() {
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState("services");

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
      contact: "studysupport@vu.edu.pk",
      phone: "+92-51-1234567",
      hours: "Mon-Fri: 9:00 AM - 5:00 PM",
      location: "Online Sessions Available"
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
      contact: "techsupport@vu.edu.pk",
      phone: "+92-51-1234568",
      hours: "Mon-Sun: 24/7",
      location: "Online Support Portal"
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
      contact: "careerguidance@vu.edu.pk",
      phone: "+92-51-1234569",
      hours: "Mon-Fri: 10:00 AM - 6:00 PM",
      location: "Virtual Career Counseling"
    },
    {
      id: 4,
      name: "Peer Mentoring Program",
      description: "Connect with senior students who can guide you through your academic journey and share their success strategies.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      contact: "mentoring@vu.edu.pk",
      phone: "+92-51-1234570",
      hours: "Mon-Fri: 10:00 AM - 6:00 PM",
      location: "Virtual Meeting Rooms"
    },
    {
      id: 5,
      name: "Online Exam Preparation",
      description: "Learn strategies for online exams, time management during tests, and how to prepare effectively for virtual assessments.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      contact: "examhelp@vu.edu.pk",
      phone: "+92-51-1234571",
      hours: "Mon-Fri: 9:00 AM - 5:00 PM",
      location: "Virtual Study Sessions"
    },
    {
      id: 6,
      name: "Student Success Workshops",
      description: "Join workshops on goal setting, motivation, stress management, and building effective study habits for online learning.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      contact: "workshops@vu.edu.pk",
      phone: "+92-51-1234572",
      hours: "Various Times (Check Schedule)",
      location: "Online Workshops"
    }
  ];

  const announcements = [
    {
      id: 1,
      title: "New Study Skills Workshop Series",
      content: "Join our weekly workshops on effective online learning strategies, time management, and exam preparation techniques.",
      date: "2024-12-10",
      category: "Study Skills"
    },
    {
      id: 2,
      title: "Career Guidance Sessions for VU Students",
      content: "Special career counseling sessions available to help you choose the right career path and prepare for job opportunities after graduation.",
      date: "2024-12-08",
      category: "Career Guidance"
    },
    {
      id: 3,
      title: "Computer & PC Support Available 24/7",
      content: "Having technical issues with your laptop or PC? Our technical support team is available round the clock to help with any computer problems.",
      date: "2024-12-05",
      category: "Technical Support"
    }
  ];

  const quickLinks = [
    { name: "Study Resources", url: "/study-resources", icon: "📚" },
    { name: "Online Learning Tips", url: "/learning-tips", icon: "💡" },
    { name: "Exam Schedule", url: "/exam-schedule", icon: "📅" },
    { name: "Student Community", url: "/community", icon: "👥" },
    { name: "Success Stories", url: "/success-stories", icon: "🏆" },
    { name: "Study Groups", url: "/study-groups", icon: "👨‍🎓" }
  ];

  return (
    <DashboardLayout currentPage="/student-services">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Services</h1>
          <p className="text-gray-600">Access all the support services and resources available to help you succeed.</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex space-x-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("services")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "services"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab("announcements")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "announcements"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Announcements
            </button>
            <button
              onClick={() => setActiveTab("quicklinks")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === "quicklinks"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Quick Links
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
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer transition ${
                    selectedService?.id === service.id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
                      <p className="text-gray-600 mb-3">{service.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.hours}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Service Details */}
            <div className="lg:col-span-1">
              {selectedService ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      {selectedService.icon}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedService.name}</h2>
                  </div>
                  
                  <p className="text-gray-600 mb-6">{selectedService.description}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Contact Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">{selectedService.contact}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-gray-600">{selectedService.phone}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Location & Hours</h3>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-gray-600">{selectedService.location}</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600">{selectedService.hours}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <button className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition">
                        Schedule Appointment
                      </button>
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

        {activeTab === "announcements" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Announcements</h2>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    <span className="text-sm text-gray-500">{announcement.date}</span>
                  </div>
                  <p className="text-gray-600 mb-3">{announcement.content}</p>
                  <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                    {announcement.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "quicklinks" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
                >
                  <span className="text-2xl mr-3">{link.icon}</span>
                  <span className="font-medium text-gray-900">{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 