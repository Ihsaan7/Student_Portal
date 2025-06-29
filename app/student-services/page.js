"use client";
import DashboardLayout from "../components/DashboardLayout";
import { useState } from "react";

export default function StudentServicesPage() {
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState("services");

  const services = [
    {
      id: 1,
      name: "Academic Advising",
      description: "Get guidance on course selection, degree requirements, and academic planning.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      contact: "advising@vu.edu.pk",
      phone: "+92-51-1234567",
      hours: "Mon-Fri: 9:00 AM - 5:00 PM",
      location: "Student Center, Room 101"
    },
    {
      id: 2,
      name: "Financial Aid",
      description: "Information about scholarships, grants, and student loan options.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7" />
        </svg>
      ),
      contact: "financialaid@vu.edu.pk",
      phone: "+92-51-1234568",
      hours: "Mon-Fri: 8:00 AM - 4:00 PM",
      location: "Administration Building, Room 205"
    },
    {
      id: 3,
      name: "Career Services",
      description: "Resume writing, job search assistance, and career counseling.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
        </svg>
      ),
      contact: "career@vu.edu.pk",
      phone: "+92-51-1234569",
      hours: "Mon-Fri: 10:00 AM - 6:00 PM",
      location: "Career Center, Room 301"
    },
    {
      id: 4,
      name: "Health Services",
      description: "Medical consultations, health screenings, and wellness programs.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      contact: "health@vu.edu.pk",
      phone: "+92-51-1234570",
      hours: "Mon-Fri: 8:00 AM - 6:00 PM",
      location: "Health Center, Ground Floor"
    },
    {
      id: 5,
      name: "IT Support",
      description: "Technical assistance with LMS, email, and computer issues.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      contact: "itsupport@vu.edu.pk",
      phone: "+92-51-1234571",
      hours: "Mon-Sun: 24/7",
      location: "IT Center, Room 401"
    },
    {
      id: 6,
      name: "Library Services",
      description: "Access to books, journals, research databases, and study spaces.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      contact: "library@vu.edu.pk",
      phone: "+92-51-1234572",
      hours: "Mon-Sat: 8:00 AM - 10:00 PM",
      location: "Main Library, 2nd Floor"
    }
  ];

  const announcements = [
    {
      id: 1,
      title: "New Scholarship Opportunities Available",
      content: "Several new scholarships have been announced for the upcoming academic year. Visit the Financial Aid office for more information.",
      date: "2024-12-10",
      category: "Financial Aid"
    },
    {
      id: 2,
      title: "Career Fair Registration Open",
      content: "The annual career fair will be held on January 15th, 2025. Register now to meet with top employers in your field.",
      date: "2024-12-08",
      category: "Career Services"
    },
    {
      id: 3,
      title: "Library Extended Hours During Finals",
      content: "The library will be open 24/7 during the final examination period from December 15th to December 22nd.",
      date: "2024-12-05",
      category: "Library Services"
    }
  ];

  const quickLinks = [
    { name: "Student Handbook", url: "/handbook", icon: "📖" },
    { name: "Academic Calendar", url: "/calendar", icon: "📅" },
    { name: "Course Catalog", url: "/courses", icon: "📚" },
    { name: "Student Portal", url: "/portal", icon: "🌐" },
    { name: "Email Access", url: "/email", icon: "📧" },
    { name: "LMS Support", url: "/lms-help", icon: "💻" }
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