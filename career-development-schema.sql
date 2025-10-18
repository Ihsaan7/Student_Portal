-- Career Development Content Table
-- This table stores admin-manageable content for different career paths and timelines

CREATE TABLE career_development_content (
    id SERIAL PRIMARY KEY,
    career_path VARCHAR(50) NOT NULL CHECK (career_path IN ('ethical-hacking', 'ai-ml', 'cyber-security')),
    timeline VARCHAR(20) NOT NULL CHECK (timeline IN ('start', 'middle', 'end')),
    instructions TEXT,
    steps TEXT,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique combination of career_path and timeline
    UNIQUE(career_path, timeline)
);

-- Create index for faster queries
CREATE INDEX idx_career_development_path_timeline ON career_development_content(career_path, timeline);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_career_development_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_career_development_updated_at
    BEFORE UPDATE ON career_development_content
    FOR EACH ROW
    EXECUTE FUNCTION update_career_development_updated_at();

-- Insert sample data for demonstration
INSERT INTO career_development_content (career_path, timeline, instructions, steps, video_url) VALUES
-- START TIMELINE (4 years)
(
    'ethical-hacking',
    'start',
    '<h3>Welcome to Ethical Hacking Journey</h3><p>As a beginner in ethical hacking, you will focus on building strong foundational knowledge in cybersecurity principles, networking, and basic security tools.</p><ul><li>Understand the legal and ethical aspects of hacking</li><li>Learn about different types of cyber threats</li><li>Master basic networking concepts</li><li>Get familiar with Linux operating system</li></ul>',
    '<ol><li><strong>Complete Cybersecurity Fundamentals Course</strong><br>Start with basic cybersecurity concepts and terminology</li><li><strong>Learn Linux Command Line</strong><br>Master essential Linux commands and file system navigation</li><li><strong>Study Networking Basics</strong><br>Understand TCP/IP, OSI model, and network protocols</li><li><strong>Practice with Virtual Labs</strong><br>Set up virtual machines and practice in safe environments</li><li><strong>Join Cybersecurity Communities</strong><br>Connect with other students and professionals in the field</li></ol>',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
    'ai-ml',
    'start',
    '<h3>Beginning Your AI/ML Journey</h3><p>Starting your artificial intelligence and machine learning journey requires building strong mathematical foundations and programming skills.</p><ul><li>Master Python programming language</li><li>Understand statistics and linear algebra</li><li>Learn data manipulation and visualization</li><li>Get familiar with machine learning concepts</li></ul>',
    '<ol><li><strong>Master Python Programming</strong><br>Learn Python syntax, data structures, and object-oriented programming</li><li><strong>Study Mathematics for ML</strong><br>Focus on statistics, linear algebra, and calculus</li><li><strong>Learn Data Analysis</strong><br>Master pandas, numpy, and matplotlib libraries</li><li><strong>Complete ML Fundamentals</strong><br>Understand supervised and unsupervised learning</li><li><strong>Work on Practice Projects</strong><br>Build simple ML models with real datasets</li></ol>',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
    'cyber-security',
    'start',
    '<h3>Starting Your Cybersecurity Career</h3><p>Begin your cybersecurity journey by understanding the threat landscape and building defensive security skills.</p><ul><li>Learn about common cyber threats and attacks</li><li>Understand security frameworks and compliance</li><li>Master security tools and technologies</li><li>Develop incident response skills</li></ul>',
    '<ol><li><strong>Study Security Fundamentals</strong><br>Learn about CIA triad, risk management, and security policies</li><li><strong>Master Security Tools</strong><br>Get familiar with firewalls, antivirus, and monitoring tools</li><li><strong>Learn Network Security</strong><br>Understand VPNs, IDS/IPS, and network segmentation</li><li><strong>Practice Incident Response</strong><br>Learn how to detect, analyze, and respond to security incidents</li><li><strong>Get Security Certifications</strong><br>Prepare for CompTIA Security+ or similar entry-level certifications</li></ol>',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
),

-- MIDDLE TIMELINE (2 years)
(
    'ethical-hacking',
    'middle',
    '<h3>Advancing Your Ethical Hacking Skills</h3><p>In the middle phase of your journey, focus on developing intermediate penetration testing skills and specialized security knowledge.</p><ul><li>Master advanced penetration testing techniques</li><li>Learn web application security testing</li><li>Understand wireless network security</li><li>Develop scripting and automation skills</li></ul>',
    '<ol><li><strong>Advanced Penetration Testing</strong><br>Learn advanced exploitation techniques and post-exploitation methods</li><li><strong>Web Application Security</strong><br>Master OWASP Top 10 and web app penetration testing</li><li><strong>Wireless Security Testing</strong><br>Learn WiFi security assessment and wireless attack vectors</li><li><strong>Scripting for Security</strong><br>Develop Python and Bash scripting skills for automation</li><li><strong>Industry Certifications</strong><br>Prepare for CEH or OSCP certifications</li></ol>',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
    'ai-ml',
    'middle',
    '<h3>Intermediate AI/ML Development</h3><p>Build upon your foundational knowledge to tackle more complex machine learning problems and specialized domains.</p><ul><li>Master deep learning frameworks</li><li>Learn computer vision and NLP</li><li>Understand MLOps and deployment</li><li>Work on real-world projects</li></ul>',
    '<ol><li><strong>Deep Learning Mastery</strong><br>Learn TensorFlow, PyTorch, and neural network architectures</li><li><strong>Specialized Domains</strong><br>Focus on computer vision, NLP, or reinforcement learning</li><li><strong>MLOps and Deployment</strong><br>Learn model deployment, monitoring, and CI/CD for ML</li><li><strong>Portfolio Projects</strong><br>Build end-to-end ML projects for your portfolio</li><li><strong>Industry Experience</strong><br>Seek internships or contribute to open-source ML projects</li></ol>',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
    'cyber-security',
    'middle',
    '<h3>Intermediate Cybersecurity Specialization</h3><p>Deepen your cybersecurity expertise by specializing in specific domains and gaining hands-on experience.</p><ul><li>Choose a cybersecurity specialization</li><li>Master advanced security tools</li><li>Understand threat intelligence</li><li>Develop incident response skills</li></ul>',
    '<ol><li><strong>Choose Specialization</strong><br>Focus on SOC analysis, digital forensics, or security architecture</li><li><strong>Advanced Security Tools</strong><br>Master SIEM platforms, forensics tools, and threat hunting</li><li><strong>Threat Intelligence</strong><br>Learn threat hunting, malware analysis, and intelligence gathering</li><li><strong>Hands-on Experience</strong><br>Participate in CTF competitions and security labs</li><li><strong>Professional Certifications</strong><br>Pursue CISSP, GCIH, or specialized security certifications</li></ol>',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
),

-- END TIMELINE (1 year)
(
    'ethical-hacking',
    'end',
    '<h3>Expert-Level Ethical Hacking</h3><p>In your final phase, focus on advanced research, leadership, and preparing for senior security roles.</p><ul><li>Conduct original security research</li><li>Lead security assessments</li><li>Mentor junior security professionals</li><li>Prepare for senior roles</li></ul>',
    '<ol><li><strong>Security Research</strong><br>Conduct original vulnerability research and publish findings</li><li><strong>Advanced Certifications</strong><br>Pursue OSEE, OSCE, or other expert-level certifications</li><li><strong>Leadership Skills</strong><br>Lead penetration testing teams and security projects</li><li><strong>Industry Networking</strong><br>Speak at conferences and build professional network</li><li><strong>Career Preparation</strong><br>Prepare for senior pentester or security consultant roles</li></ol>',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
    'ai-ml',
    'end',
    '<h3>AI/ML Expert and Leader</h3><p>Prepare for senior AI/ML roles by focusing on research, leadership, and cutting-edge technologies.</p><ul><li>Conduct AI research projects</li><li>Lead ML teams and projects</li><li>Stay current with latest AI trends</li><li>Prepare for industry leadership</li></ul>',
    '<ol><li><strong>Research and Innovation</strong><br>Conduct original AI research and publish papers</li><li><strong>Advanced AI Technologies</strong><br>Explore cutting-edge areas like AGI, quantum ML, or AI ethics</li><li><strong>Team Leadership</strong><br>Lead ML teams and mentor junior data scientists</li><li><strong>Industry Impact</strong><br>Contribute to open-source projects and AI community</li><li><strong>Senior Role Preparation</strong><br>Prepare for ML architect, AI director, or research scientist roles</li></ol>',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
),
(
    'cyber-security',
    'end',
    '<h3>Cybersecurity Leadership</h3><p>Transition into cybersecurity leadership roles with strategic thinking and advanced expertise.</p><ul><li>Develop strategic security thinking</li><li>Lead cybersecurity programs</li><li>Understand business risk management</li><li>Prepare for executive roles</li></ul>',
    '<ol><li><strong>Strategic Security Leadership</strong><br>Develop enterprise security strategy and governance</li><li><strong>Advanced Risk Management</strong><br>Master business risk assessment and security ROI</li><li><strong>Team and Program Management</strong><br>Lead large security teams and enterprise programs</li><li><strong>Industry Thought Leadership</strong><br>Speak at conferences and contribute to security standards</li><li><strong>Executive Preparation</strong><br>Prepare for CISO, security director, or consultant roles</li></ol>',
    'https://www.youtube.com/embed/dQw4w9WgXcQ'
);

-- Comments explaining the table structure
COMMENT ON TABLE career_development_content IS 'Stores admin-manageable career development content for different paths and timelines';
COMMENT ON COLUMN career_development_content.career_path IS 'The career path: ethical-hacking, ai-ml, or cyber-security';
COMMENT ON COLUMN career_development_content.timeline IS 'University timeline: start (4 years), middle (2 years), or end (1 year)';
COMMENT ON COLUMN career_development_content.instructions IS 'HTML content for instructions section';
COMMENT ON COLUMN career_development_content.steps IS 'HTML content for action steps section';
COMMENT ON COLUMN career_development_content.video_url IS 'URL for embedded video content (YouTube, Vimeo, etc.)';