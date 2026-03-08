import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  { quote: "Tutor Quest helped me find a great math tutor near my home. My grades improved significantly!", name: "Arjun K.", role: "Student", initials: "AK" },
  { quote: "It saved us hours of searching for a reliable tutor. The verified profiles gave us confidence.", name: "Sunita M.", role: "Parent", initials: "SM" },
  { quote: "I started receiving student requests within days of signing up. Excellent platform for tutors!", name: "Deepak R.", role: "Tutor", initials: "DR" },
];

const Testimonials = () => {
  return (
    <section className="bg-muted/50 py-20">
      <div className="container">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            What Our Users Say
          </h2>
          <p className="mt-3 text-muted-foreground">Real stories from students, parents, and tutors</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/20" />
                <p className="mt-4 leading-relaxed text-foreground">{t.quote}</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{t.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
