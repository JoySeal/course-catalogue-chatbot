import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document'; 
import { CardActions, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import IconButton from '@mui/material/IconButton';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarIcon from '@mui/icons-material/Star';
import {Accordion, AccordionItem, AccordionTrigger, Card} from '@/components/ui/accordion';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, I am Bloom, you can ask a question about the courses that I have in the catalogue. I will advice courses that match your request.',
        type: 'apiMessage',
      },
    ],
    history: [],
  });

  const { messages, history } = messageState;
  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<string[]>([]);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    // Inside the handleSubmit function
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      history,
    }),
  });
  const data = await response.json();
  console.log('data', data);

  if (data.error) {
    setError(data.error);
  } else {
    const sourceDocumentCount = Math.min(data.sourceDocuments.length, 6);
    const newRecommendedCourses: string[] = data.sourceDocuments.map((doc: { pageContent: string }) => doc.pageContent);
    // Check if any of the recommended courses are already in the list
    const uniqueRecommendedCourses = newRecommendedCourses.filter((course) => !recommendedCourses.includes(course));
    
    if (uniqueRecommendedCourses.length > 0) {
      setMessageState((state) => ({
        ...state,
        messages: [
          ...state.messages,
          {
            type: 'apiMessage',
            message: data.text,
            sourceDocs: data.sourceDocuments,
          },
        ],
        history: [...state.history, [question, data.text]],
      }));
      
      setRecommendedCourses([...recommendedCourses, ...uniqueRecommendedCourses]);
    } else {
      // Handle the case when all recommended courses are duplicates
      setError('No new unique course recommendations.');
    }
  }
  console.log('messageState', messageState);

  setLoading(false);

  //scroll to bottom
  messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
} catch (error) {
  setLoading(false);
  setError('An error occurred while fetching the data. Please try again.');
  console.log('error', error);
}  
  }
  
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  function renderRatingStars(rating: number) {
    const numStars = Math.floor(rating);
    const fractionalStar = rating - numStars;
    const stars = [];
  
    // Add full stars
    for (let i = 0; i < numStars; i++) {
      stars.push(<StarIcon key={`star-full-${i}`} />);
    }
      if (fractionalStar > 0.25) {
      stars.push(<StarHalfIcon key={`star-half`} />);
    }
  
    return stars;
  }
  

  return (
    <>
      <Layout>
        <div className="mx-auto flex flex-col gap-4">
          <Typography className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
            Chat with our course catalogue
          </Typography>
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        key={index}
                        src="/ai.png"
                        alt="AI"
                        width="40"
                        height="40"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={index}
                        src="/employee.png"
                        alt="Me"
                        width="30"
                        height="30"
                        className={styles.usericon}
                        priority
                      />
                    );
                    className =
                      loading && index === messages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }

                  console.log(message);

                  return (
                    <>
                      <div key={`chatMessage-${index}`} className={className}>
                        {icon}
                        <div className={styles.markdownanswer}>
                          <ReactMarkdown linkTarget="_blank">{message.message}</ReactMarkdown>
                        </div>
                      </div>
                     
                      {message.sourceDocs && (
  <div>
    <Typography className={styles.center}>
      These are the best matching courses for your request
    </Typography>
    <div className="p-5">
      <div className="p-5">
        <Accordion type="single" collapsible className="flex-col">
          {message.sourceDocs.map((doc, docIndex) => (
            <div key={`messageSourceDocs-${docIndex}`}>
              <AccordionItem value={`item-${docIndex}`}>
                <AccordionTrigger>
                  <h3>Course {docIndex + 1}</h3>
                </AccordionTrigger>
                <Card className={styles.card}>
                  {doc.pageContent.split('\n').map((line, lineIndex) => {
                    if (line.startsWith('title: ')) {
                      return (
                        <Typography key={`line-${lineIndex}`}>
                          <strong>{line.replace(/^title: '/, '').replace(/'$/, '')}</strong>
                        </Typography>
                      );
                    } else if (line.startsWith('description: ')) {
                      return (
                        <Typography key={`line-${lineIndex}`}>
                          <i>{line.replace(/^description: '/, '').replace(/'$/, '')}</i>
                        </Typography>
                      );
                    }  
                                    else if (line.startsWith('rating: ')) {
                                      const ratingString = line.replace(/^rating: /, '');
                                      const cleanedRatingString = ratingString.replace(/[^\d.]/g, '');
                                      const numericRating = parseFloat(cleanedRatingString);
                  
                                      if (!isNaN(numericRating)) {
                                        return (
                                          <div key={`line-${lineIndex}`}>
                                            <Typography>
                                              Rating: {numericRating.toFixed(1)} ({numericRating > 0 ? renderRatingStars(numericRating) : 'N/A'})
                                            </Typography>
                                          </div>
                                        );
                                      } else {
                                        // Handle the case when the rating is not a valid number
                                        return (
                                          <div key={`line-${lineIndex}`}>
                                            <Typography>Rating: N/A</Typography>
                                          </div>
                                        );
                                      }
                                    }
                                    else if (line.startsWith('price: ')) {
                                      const priceWithoutQuotes = line.replace(/^price: '/, '').replace(/'$/, '');
                                      return (
                                        <Typography key={`line-${lineIndex}`}>
                                          Price: <span>&#8364;{priceWithoutQuotes}</span>
                                        </Typography>
                                      );
                                    }
                                      
                                    else {
                                      return (
                                        <Typography key={`line-${lineIndex}`}>
                                          {line}
                                        </Typography>
                                      );
                                    }
                                  })}
           
                                    <CardActions disableSpacing>
                                    <IconButton aria-label="add to favorites">
                                      <FavoriteIcon color="secondary" className={styles.favorite} />
                                    </IconButton>
                                    <IconButton aria-label="share">
                                      <ShareIcon color="success" />
                                    </IconButton>
                                    </CardActions>
                                  </Card>
                                </AccordionItem>
                              </div> 
                            ))}
                          </Accordion>
                          </div>
                        </div>
                      </div>
                    )}
                    </>
                  );
                })}
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={handleSubmit}>
                  <textarea
                    disabled={loading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    rows={1}
                    maxLength={512}
                    id="userInput"
                    name="userInput"
                    placeholder={
                      loading
                        ? 'Waiting for response...'
                        : 'What kind of course are you looking for?'
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.generatebutton}
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {error && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </main>
        </div>
      </Layout>
    </>
  );
}