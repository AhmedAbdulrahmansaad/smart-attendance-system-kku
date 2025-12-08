import React from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from './ui/card';
import { Users, Award, Sparkles, Mail, Linkedin, Github, ArrowLeft, Moon, Sun, Globe, GraduationCap, Star } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';
import { useTranslation } from '../utils/i18n';
import { Button } from './ui/button';

interface TeamMember {
  name: string;
  nameEn: string;
  id: string;
  role: string;
  roleEn: string;
  color: string;
  avatar: string;
}

export function TeamPage({ onBack }: { onBack: () => void }) {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslation(language);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const teamMembers: TeamMember[] = [
    {
      name: 'نفيسة محمد صالح',
      nameEn: 'Nafisah Mohammed Saleh',
      id: '443816488',
      role: 'قائد الفريق',
      roleEn: 'Team Leader',
      color: 'from-amber-500 via-yellow-500 to-gold',
      avatar: '👑'
    },
    {
      name: 'شذا محمد عسيري',
      nameEn: 'Shatha Mohammed Asiri',
      id: '441807510',
      role: 'مطور رئيسي',
      roleEn: 'Lead Developer',
      color: 'from-emerald-500 via-green-500 to-teal-500',
      avatar: '💻'
    },
    {
      name: 'مريم مهدي القحطاني',
      nameEn: 'Maryam Mahdi Alqahtani',
      id: '441801563',
      role: 'مطور واجهات',
      roleEn: 'Frontend Developer',
      color: 'from-pink-500 via-rose-500 to-red-500',
      avatar: '🎨'
    },
    {
      name: 'فاطمة غرامة عسيري',
      nameEn: 'Fatimah Gharamah Asiri',
      id: '442803560',
      role: 'مصمم UI/UX',
      roleEn: 'UI/UX Designer',
      color: 'from-orange-500 via-amber-500 to-yellow-500',
      avatar: '✨'
    },
    {
      name: 'بشاير محمد الشهراني',
      nameEn: 'Bashaer Mohammed Alshahrani',
      id: '442807848',
      role: 'مطور Backend',
      roleEn: 'Backend Developer',
      color: 'from-indigo-500 via-blue-500 to-cyan-500',
      avatar: '⚡'
    },
  ];

  const supervisors = [
    {
      name: 'د. منال سعيد بن محمد أبو ملحة',
      nameEn: 'Dr. Manal Saeed Bin Mohammed Abu Malhah',
      role: 'المشرف الأكاديمي الرئيسي',
      roleEn: 'Main Academic Supervisor',
      department: 'قسم تقنية المعلومات',
      departmentEn: 'Information Technology Department'
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1680226426952-514723cee6b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmd8ZW58MXx8fHwxNzYyODE5NDY3fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="University"
          className="w-full h-full object-cover opacity-5 dark:opacity-[0.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-gold/5"></div>
        <div className="absolute inset-0 hero-pattern opacity-10"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="gap-2 hover:bg-primary/10">
            <ArrowLeft className="w-4 h-4" />
            {t('back')}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full hover:bg-primary/10"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-gold" /> : <Moon className="w-5 h-5 text-primary" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="rounded-full hover:bg-primary/10"
            >
              <Globe className="w-5 h-5 text-primary" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass border-2 border-primary/20 mb-8">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="text-base font-bold bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent">
              {language === 'ar' ? 'مشروع تخرج 2025' : 'Graduation Project 2025'}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            {language === 'ar' ? (
              <>
                <span className="bg-gradient-to-r from-primary via-accent to-gold bg-clip-text text-transparent">
                  الفريق المبدع
                </span>
                <br />
                وراء المشروع
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-primary via-accent to-gold bg-clip-text text-transparent">
                  Creative Team
                </span>
                <br />
                Behind the Project
              </>
            )}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {language === 'ar'
              ? 'مجموعة متميزة من الطالبات المبدعات اللواتي عملن على تطوير نظام الحضور الذكي بتقنيات حديثة وابتكارية'
              : 'A distinguished group of creative students who worked on developing the smart attendance system with modern and innovative technologies'}
          </p>
        </motion.div>

        {/* Team Members Section */}
        <div className="mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border border-primary/20 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-black">{t('teamMembers')}</h2>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full overflow-hidden border-2 border-primary/20 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 glass">
                  <div className={`h-3 bg-gradient-to-r ${member.color}`}></div>
                  
                  <CardContent className="pt-10 pb-8 text-center relative">
                    {/* Leader Badge */}
                    {member.roleEn === 'Team Leader' && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-4 right-4"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-gold flex items-center justify-center shadow-xl">
                          <Star className="w-5 h-5 text-white" fill="white" />
                        </div>
                      </motion.div>
                    )}

                    {/* Avatar */}
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className={`w-32 h-32 rounded-full bg-gradient-to-br ${member.color} mx-auto mb-6 flex items-center justify-center shadow-2xl border-4 border-background`}
                    >
                      <span className="text-6xl">{member.avatar}</span>
                    </motion.div>

                    <h3 className="text-2xl font-black mb-3">
                      {language === 'ar' ? member.name : member.nameEn}
                    </h3>

                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="text-sm px-4 py-1.5 rounded-full bg-muted text-muted-foreground font-bold border border-border">
                        {member.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-6">
                      <span className={`text-base px-6 py-2 rounded-full font-bold bg-gradient-to-r ${member.color} text-white shadow-lg`}>
                        {language === 'ar' ? member.role : member.roleEn}
                      </span>
                    </div>

                    <div className="flex justify-center gap-2 pt-6 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10">
                        <Mail className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10">
                        <Linkedin className="w-4 h-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10">
                        <Github className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Supervisors Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border border-gold/30 mb-6">
              <GraduationCap className="w-6 h-6 text-gold" />
              <h2 className="text-2xl font-black">{t('academicSupervision')}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {supervisors.map((supervisor, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
              >
                <Card className="h-full border-2 border-gold/30 bg-gradient-to-br from-gold/5 to-primary/5 hover:shadow-2xl transition-all duration-300 glass">
                  <CardContent className="pt-12 pb-10 text-center">
                    <div className="w-36 h-36 rounded-full bg-gradient-to-br from-primary via-accent to-gold mx-auto mb-8 flex items-center justify-center shadow-2xl border-4 border-background">
                      <span className="text-6xl">🎓</span>
                    </div>

                    <h3 className="text-3xl font-black mb-4">
                      {language === 'ar' ? supervisor.name : supervisor.nameEn}
                    </h3>

                    <p className="text-lg font-semibold text-primary mb-3">
                      {language === 'ar' ? supervisor.role : supervisor.roleEn}
                    </p>

                    <p className="text-base text-muted-foreground mb-6">
                      {language === 'ar' ? supervisor.department : supervisor.departmentEn}
                    </p>

                    <div className="flex justify-center gap-3">
                      <Button size="sm" variant="outline" className="gap-2 border-2 hover:bg-primary/5">
                        <Mail className="w-4 h-4" />
                        {language === 'ar' ? 'تواصل' : 'Contact'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-24 text-center"
        >
          <div className="glass rounded-3xl p-12 border-2 border-primary/20 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-primary via-accent to-gold text-white shadow-2xl mb-6">
              <Award className="w-6 h-6" />
              <span className="font-black text-xl">
                {language === 'ar'
                  ? 'مشروع تخرج - جامعة الملك خالد 2025'
                  : 'Graduation Project - King Khalid University 2025'}
              </span>
            </div>

            <p className="text-lg text-muted-foreground mb-4">
              {language === 'ar'
                ? 'نظام الحضور الذكي - تطوير كامل بتقنيات حديثة'
                : 'Smart Attendance System - Complete Development with Modern Technologies'}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 rounded-full glass border border-primary/20 text-sm font-semibold">
                React + TypeScript
              </span>
              <span className="px-4 py-2 rounded-full glass border border-primary/20 text-sm font-semibold">
                Supabase
              </span>
              <span className="px-4 py-2 rounded-full glass border border-primary/20 text-sm font-semibold">
                Tailwind CSS
              </span>
              <span className="px-4 py-2 rounded-full glass border border-primary/20 text-sm font-semibold">
                Motion
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}