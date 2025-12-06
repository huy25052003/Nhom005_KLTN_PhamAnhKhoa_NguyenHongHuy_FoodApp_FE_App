import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Modal, 
  TextInput, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { useAuth } from "../store/auth";
import { X, Send } from 'lucide-react-native';
import { initConversation, getMessages, sendMessage as sendChatMessage } from "../api/chat";

export default function AdminChatWidget({ onClose }) {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const scrollViewRef = useRef(null);
  const wsRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Load user info and init conversation
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        // Init or get conversation (includes user data)
        const convData = await initConversation();
        console.log("Conversation data:", convData);
        
        if (!convData || !convData.id) {
          console.error("Failed to create conversation:", convData);
          setIsLoading(false);
          return;
        }
        
        setConversation(convData);
        setCurrentUser(convData.customer); // Assuming conversation has customer info

        // Load message history
        const msgData = await getMessages(convData.id);
        console.log("Message data:", msgData);
        setMessages(Array.isArray(msgData) ? msgData : []);

        // Start polling for new messages
        startPolling(convData.id);
      } catch (error) {
        console.error("Error initializing chat:", error);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      stopPolling();
    };
  }, [token]);

  // Auto scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const startPolling = (convId) => {
    // Poll for new messages every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const msgData = await getMessages(convId);
        setMessages(Array.isArray(msgData) ? msgData : []);
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !conversation || !currentUser) return;

    const payload = {
      conversationId: conversation.id,
      senderId: currentUser.id,
      content: inputText.trim(),
    };

    try {
      const sentMsg = await sendChatMessage(payload);
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💬 Hỗ trợ khách hàng</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X color="#fff" size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {!token ? (
          <View style={styles.centerContainer}>
            <Text style={styles.mutedText}>Vui lòng đăng nhập để chat</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4caf50" />
            <Text style={styles.mutedText}>Đang tải...</Text>
          </View>
        ) : (
          <>
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {Array.isArray(messages) && messages.map((msg, index) => {
                const msgSenderId = msg.sender?.id || msg.senderId;
                const isMe = Number(msgSenderId) === Number(currentUser?.id);
                
                return (
                  <View
                    key={msg.id || index}
                    style={[
                      styles.messageBubble,
                      isMe ? styles.myMessage : styles.theirMessage
                    ]}
                  >
                    <Text style={[
                      styles.messageText,
                      isMe ? styles.myMessageText : styles.theirMessageText
                    ]}>
                      {msg.content}
                    </Text>
                    {msg.timestamp && (
                      <Text style={styles.timestamp}>
                        {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Nhập tin nhắn..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={!inputText.trim()}
              >
                <Send color={inputText.trim() ? "#4caf50" : "#ccc"} size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#4caf50",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  mutedText: {
    fontSize: 14,
    color: "#999",
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    gap: 12,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#4caf50",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  theirMessageText: {
    color: "#000",
  },
  timestamp: {
    fontSize: 11,
    color: "rgba(0,0,0,0.4)",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: "#333",
  },
  sendButton: {
    padding: 10,
  },
});
