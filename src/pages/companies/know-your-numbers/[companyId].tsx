import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/utils/api';

export default function EditCompany() {
  const utils = api.useUtils();
  const router = useRouter();
  const { companyId } = router.query;

  const { data: project, isLoading } = api.project.getById.useQuery(
    { id: companyId as string },
    {
      enabled: !!companyId,
    }
  );

  const [answers, setAnswers] = useState<Array<{ questionId: string; answer: string }>>([]);

  useEffect(() => {
    if (project?.knowYourNumbers?.answers && project.knowYourNumbers.answers.length > 0) {
      setAnswers(project.knowYourNumbers.answers);
    } else {
      setAnswers(
        Array.from({ length: 18 }, (_, i) => ({
          questionId: (i + 1).toString(),
          answer: '',
        }))
      );
    }
  }, [project]);

  const { mutate: updateKnowYourNumbers, isPending: isUpdating } =
    api.project.updateKnowYourNumbers.useMutation({
      onSuccess: async () => {
        await utils.project.getById.invalidate();
        toast.success('Answers updated successfully');
      },
      onError: () => {
        toast.error('Failed to update answers');
      },
    });

  const handleAnswerChange = (questionId: string, newAnswer: string) => {
    setAnswers(prev =>
      prev.map(answer =>
        answer.questionId === questionId ? { ...answer, answer: newAnswer } : answer
      )
    );
  };

  const handleSaveAnswers = () => {
    if (!project?.id) return;
    updateKnowYourNumbers({ id: project.id, answers });
  };

  if (isLoading) {
    return (
      <div className="mt-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        <button
          type="button"
          className="flex items-center gap-2 hover:opacity-75"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mt-4 space-y-6 rounded-xl border-2 border-white/10 bg-card md:px-16 px-4 py-8">
          <h1 className="text-lg font-bold">Know Your Numbers</h1>
          <div className="space-y-6">
            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-bold">Practical Guide: KNOW YOUR NUMBERS</h2>
                <h3 className="mt-2 text-lg">
                  How to Answer the 16 Most Frequently Asked Investor Questions
                </h3>
              </div>
              <Button onClick={handleSaveAnswers} disabled={isUpdating}>
                <Save className="h-4 w-4" /> Save Answers
              </Button>
            </div>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">Introduction</h2>
              <p className="mt-2">
                This guide was created to help entrepreneurs prepare for meetings with investors.
                Here you will find the 16 most common questions you may be asked, along with
                explanations of what investors are looking for and tips on how to respond clearly
                and effectively.
              </p>
            </section>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">1. Product and Business Model</h2>

              <div className="mt-4 space-y-8">
                <div>
                  <h3 className="font-medium">Question 1: What problem are you solving?</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> Investors want to understand if there is a
                    real pain point in the market that your product solves. Without a relevant
                    problem, the product may not have demand.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> Clearly and simply explain the problem and why
                    it is important to the target audience. Use data or real examples to reinforce
                    your response.
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '1')?.answer ?? ''}
                    onChange={e => handleAnswerChange('1', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">
                    Question 2: How does your product/service solve this problem?
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> It is crucial to demonstrate the value and
                    effectiveness of your solution. The investor wants to see if your approach makes
                    sense.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> Show how your product solves the problem
                    uniquely or more efficiently than existing solutions.
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '2')?.answer ?? ''}
                    onChange={e => handleAnswerChange('2', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">
                    Question 3: What makes your product/service unique or innovative?
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> The investor is looking for the
                    differentiation factor that gives you a competitive advantage.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> Highlight innovative features, intellectual
                    property, or exclusive advantages.
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '3')?.answer ?? ''}
                    onChange={e => handleAnswerChange('3', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">Question 4: What is your business model?</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> Investors want to know how your business
                    generates revenue.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> Explain your monetization model directly (e.g.,
                    subscription, direct sales, transaction commission).
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '4')?.answer ?? ''}
                    onChange={e => handleAnswerChange('4', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">2. Market and Customers</h2>

              <div className="mt-4 space-y-8">
                <div>
                  <h3 className="font-medium">Question 5: Who is your target audience?</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> Understanding the target audience is
                    essential to assess the scalability of the business.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> Clearly define who your ideal customers are and
                    explain why you chose this market segment.
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '5')?.answer ?? ''}
                    onChange={e => handleAnswerChange('5', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">Question 6: What is the total market size?</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> The investor wants to know if the market is
                    large enough to justify the investment.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> Provide an estimate based on market data,
                    highlighting the total available market (TAM) and the serviceable available
                    market (SAM).
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '6')?.answer ?? ''}
                    onChange={e => handleAnswerChange('6', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">3. Competition and Differentiation</h2>

              <div className="mt-4 space-y-8">
                <div>
                  <h3 className="font-medium">
                    Question 7: Who are your direct and indirect competitors?
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> Investors want to know if you understand the
                    competitive landscape.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> List the main competitors, explaining their
                    strengths and weaknesses and what differentiates you.
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '7')?.answer ?? ''}
                    onChange={e => handleAnswerChange('7', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">
                    Question 8: What sets you apart from the competition?
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> Demonstrating your competitive advantage is
                    crucial to capturing investor interest.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> Focus on your product&apos;s strengths, whether
                    it&apos;s technology, customer service, or exclusive market access.
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '8')?.answer ?? ''}
                    onChange={e => handleAnswerChange('8', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">4. Strategy and Growth</h2>

              <div className="mt-4 space-y-8">
                <div>
                  <h3 className="font-medium">
                    Question 9: What is your short- and long-term growth strategy?
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> Investors want to know if you have a clear
                    vision for the future.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> Describe your expansion plans and strategies for
                    achieving short-term goals and long-term growth.
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '9')?.answer ?? ''}
                    onChange={e => handleAnswerChange('9', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">
                    Question 10: How do you plan to acquire users/customers?
                  </h3>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>Why this question?</strong> The investor assesses whether you have an
                    effective customer acquisition strategy.
                  </p>
                  <p className="mt-1 text-sm text-gray-300">
                    <strong>How to answer:</strong> Present your main marketing strategies and
                    acquisition channels (e.g., social media, partnerships, SEO).
                  </p>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '10')?.answer ?? ''}
                    onChange={e => handleAnswerChange('10', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">5. Team and Organizational Structure</h2>

              <div className="mt-4 space-y-8">
                <div>
                  <h3 className="font-medium">Question 11: Who is part of the founding team?</h3>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '11')?.answer ?? ''}
                    onChange={e => handleAnswerChange('11', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">
                    Question 12: Do you plan to hire more people in the coming months?
                  </h3>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '12')?.answer ?? ''}
                    onChange={e => handleAnswerChange('12', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">6. Finances and Projections</h2>

              <div className="mt-4 space-y-8">
                <div>
                  <h3 className="font-medium">Question 13: What is your current burn rate?</h3>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '13')?.answer ?? ''}
                    onChange={e => handleAnswerChange('13', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">
                    Question 14: What are your financial projections for the next 3 to 5 years?
                  </h3>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '14')?.answer ?? ''}
                    onChange={e => handleAnswerChange('14', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">7. Investment and Return</h2>

              <div className="mt-4 space-y-8">
                <div>
                  <h3 className="font-medium">
                    Question 15: How much are you raising at the moment?
                  </h3>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '15')?.answer ?? ''}
                    onChange={e => handleAnswerChange('15', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">
                    Question 16: What is your exit strategy for investors?
                  </h3>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '16')?.answer ?? ''}
                    onChange={e => handleAnswerChange('16', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">8. Project Valuation and Equity Negotiation</h2>

              <div className="mt-4 space-y-8">
                <div>
                  <h3 className="font-medium">How to assess your project?</h3>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '17')?.answer ?? ''}
                    onChange={e => handleAnswerChange('17', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className="font-medium">Equity negotiation</h3>
                  <Textarea
                    className="mt-2"
                    placeholder="Enter your answer here"
                    disabled={isUpdating || isLoading}
                    value={answers.find(answer => answer.questionId === '18')?.answer ?? ''}
                    onChange={e => handleAnswerChange('18', e.target.value)}
                  />
                </div>
              </div>
            </section>

            <hr className="border-white/10" />

            <section>
              <h2 className="text-lg font-semibold">Conclusion</h2>
              <p className="mt-2">
                Knowing your numbers and answering investor questions clearly and structuredly can
                make all the difference in raising capital for your project. Use this guide to
                prepare yourself and adapt your answers to the reality of your business.
              </p>
              <p className="mt-4 font-medium">
                Good luck, great business, and remember... Know Your Numbers!
              </p>
              <p className="mt-2">
                <strong>Guilherme Beauvalet</strong>
                <br />
                <a href="http://www.im-vestor.com" className="text-blue-400 hover:underline">
                  www.im-vestor.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
