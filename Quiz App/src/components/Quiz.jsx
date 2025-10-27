




import React, { useState, useEffect } from "react";
import { quizData } from "../data/questions";
import { shuffleArray } from "../utils/shuffle";
import { Howl } from "howler";
import dingSound from "../assets/ding.mp3";
import buzzSound from "../assets/buzz.mp3";
import { Moon, Sun } from "lucide-react"; // 🌙☀️ Icons for theme toggle
import "../App.css";

// ✅ Theme Toggle Button Component (merged)
const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === "dark" ? (
        <>
          <Sun size={20} /> <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon size={20} /> <span>Dark Mode</span>
        </>
      )}
    </button>
  );
};

// ✅ Quiz Component
const Quiz = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [feedback, setFeedback] = useState("");
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [badge, setBadge] = useState("");
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("highScore")) || 0
  );

  // Lifelines
  const [usedLifelines, setUsedLifelines] = useState({
    fiftyFifty: false,
    audience: false,
    skip: false,
  });
  const [visibleOptions, setVisibleOptions] = useState([]);
  const [audiencePoll, setAudiencePoll] = useState(null);

  // Sounds
  const ding = new Howl({ src: [dingSound] });
  const buzz = new Howl({ src: [buzzSound] });

  // Initialize Quiz
  const initializeQuiz = (category, difficulty) => {
    const selectedQuestions = quizData[category]?.[difficulty] || [];
    const shuffledQuestions = shuffleArray(selectedQuestions).map((q) => ({
      ...q,
      options: shuffleArray(q.options),
    }));

    setQuestions(shuffledQuestions);
    setVisibleOptions(shuffledQuestions[0]?.options || []);
    setCurrentQ(0);
    setScore(0);
    setShowQuiz(true);
    setShowSummary(false);
    setSelectedOption(null);
    setTimeLeft(15);
    setFeedback("");
    setUsedLifelines({ fiftyFifty: false, audience: false, skip: false });
    setAudiencePoll(null);
    setStreak(0);
    setBestStreak(0);
  };

  // Timer
  useEffect(() => {
    if (!showQuiz || showSummary) return;
    if (timeLeft === 0) {
      handleAnswer(null);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showQuiz, showSummary]);

  // Handle Answers
  const handleAnswer = (option) => {
    if (selectedOption) return;

    const correctAnswer = questions[currentQ].answer;
    const isCorrect = option === correctAnswer;

    if (isCorrect) {
      ding.play();
      setScore((prev) => prev + 1);
      setFeedback("✅ Correct!");
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
    } else {
      buzz.play();
      setFeedback("❌ Wrong!");
      setStreak(0);
    }

    setSelectedOption(option);
    setTimeout(() => {
      setFeedback("");
      moveNext();
    }, 1000);
  };

  const moveNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      setVisibleOptions(questions[currentQ + 1].options);
      setSelectedOption(null);
      setAudiencePoll(null);
      setTimeLeft(15);
    } else {
      endQuiz();
    }
  };

  const endQuiz = () => {
    setShowSummary(true);
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) setBadge("🥇 Gold Champion");
    else if (percentage >= 80) setBadge("🥈 Silver Star");
    else if (percentage >= 50) setBadge("🥉 Bronze Learner");
    else setBadge("💪 Keep Trying");

    if (score > highScore) {
      localStorage.setItem("highScore", score);
      setHighScore(score);
    }
  };

  // Lifelines
  const useFiftyFifty = () => {
    if (usedLifelines.fiftyFifty) return;
    const correct = questions[currentQ].answer;
    const wrongOptions = questions[currentQ].options.filter((o) => o !== correct);
    const remove = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
    const remaining = questions[currentQ].options.filter((o) => !remove.includes(o));
    setVisibleOptions(remaining);
    setUsedLifelines({ ...usedLifelines, fiftyFifty: true });
  };

  const useAudience = () => {
    if (usedLifelines.audience) return;
    const percentages = {};
    const correct = questions[currentQ].answer;
    const total = 100;
    const correctPercent = Math.floor(Math.random() * 30) + 50;
    let remaining = total - correctPercent;

    questions[currentQ].options.forEach((opt) => {
      if (opt === correct) {
        percentages[opt] = correctPercent;
      } else {
        const rand = Math.floor(Math.random() * remaining);
        percentages[opt] = rand;
        remaining -= rand;
      }
    });

    setAudiencePoll(percentages);
    setUsedLifelines({ ...usedLifelines, audience: true });
  };

  const useSkip = () => {
    if (usedLifelines.skip) return;
    setUsedLifelines({ ...usedLifelines, skip: true });
    moveNext();
  };

  const restartQuiz = () => initializeQuiz(selectedCategory, selectedDifficulty);

 

  // UI
  return (
    <div className="quiz-container">
      {/* 🌗 Theme Toggle Button at Top */}
      <div className="theme-toggle-wrapper">
        <ThemeToggle />
      </div>

      {/* Selection Screen */}
      {!showQuiz && !showSummary && (
        <div className="selection-screen">
          <h2>Select Category & Difficulty</h2>
          <div className="select-group">
            <label>Category:</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">-- Select Category --</option>
              {Object.keys(quizData).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="select-group">
            <label>Difficulty:</label>
            <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)}>
              <option value="">-- Select Difficulty --</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <button
            onClick={() =>
              selectedCategory && selectedDifficulty
                ? initializeQuiz(selectedCategory, selectedDifficulty)
                : alert("Please select both!")
            }
            className="start-btn"
          >
            🎮 Start Quiz
          </button>
        </div>
      )}

      {/* Quiz Screen */}
      {showQuiz && !showSummary && (
        <>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}></div>
          </div>

          <p>Question {currentQ + 1} of {questions.length}</p>
          <div className="timer">⏳ {timeLeft}s</div>

          <h3>{questions[currentQ].question}</h3>

          <div className="options">
            {(visibleOptions.length ? visibleOptions : questions[currentQ].options).map((opt, idx) => {
              let className = "";
              if (selectedOption) {
                if (opt === questions[currentQ].answer) className = "correct";
                else if (opt === selectedOption) className = "wrong";
              }
              return (
                <button
                  key={idx}
                  className={`option-btn ${className}`}
                  onClick={() => handleAnswer(opt)}
                  disabled={!!selectedOption}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {feedback && <p className="feedback">{feedback}</p>}

          <p className="streak-text">🔥 Current Streak: {streak} | 🏅 Best: {bestStreak}</p>

          {audiencePoll && (
            <div className="audience-poll">
              <h4>📊 Audience Poll:</h4>
              {Object.entries(audiencePoll).map(([opt, percent]) => (
                <p key={opt}>{opt}: {percent}%</p>
              ))}
            </div>
          )}

          <div className="lifelines">
            <button onClick={useFiftyFifty} disabled={usedLifelines.fiftyFifty}>💡 50-50</button>
            <button onClick={useAudience} disabled={usedLifelines.audience}>👥 Audience</button>
            <button onClick={useSkip} disabled={usedLifelines.skip}>⏭ Skip</button>
          </div>
        </>
      )}

      {/* Summary Screen */}
      {showSummary && (
        <div className="summary-screen">
          <h2>{selectedCategory} ({selectedDifficulty}) Completed!</h2>
          <h3>🎯 Score: {score}/{questions.length}</h3>
          <p className="badge">{badge}</p>
          <h4>🔥 Best Streak: {bestStreak}</h4>
          <h4>🏆 Highest Score: {highScore}</h4>

          <button className="restart-btn" onClick={restartQuiz}>🔄 Restart</button>
          <button
            className="category-btn"
            onClick={() => {
              setShowQuiz(false);
              setShowSummary(false);
              setSelectedCategory("");
              setSelectedDifficulty("");
            }}
          >
            🏠 Choose Another
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
