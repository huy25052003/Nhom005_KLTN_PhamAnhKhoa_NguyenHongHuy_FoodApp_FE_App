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
import { usePathname } from "expo-router";

export default function ChatbotWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là AI Assistant của FoodApp. Tôi có thể giúp gì cho bạn?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollViewRef = useRef(null);

  // Botpress configuration - Lấy từ file config của web
  const BOT_ID = "9c7e30ed-a703-45ee-b229-986c7ce50038";
  const CLIENT_ID = "c7c085ad-0340-4613-8ffe-c669a1862745";
  
  // Simple pattern matching chatbot (fallback khi không connect được Botpress)
  const getBotResponse = (userText) => {
    const text = userText.toLowerCase();
    
    // Greeting
    if (text.match(/^(xin chào|chào|hello|hi|hey)/i)) {
      return "Xin chào! Tôi là AI Assistant của FoodApp. Tôi có thể giúp bạn:\n\n🍱 Tìm hiểu về thực đơn\n📦 Theo dõi đơn hàng\n💰 Xem giá và gói cước\n📞 Liên hệ hỗ trợ\n\nBạn cần tôi giúp gì?";
    }
    
    // Menu/Food
    if (text.match(/thực đơn|món ăn|menu|đồ ăn|món/i)) {
      return "FoodApp có nhiều gói thực đơn đa dạng:\n\n🥗 Gói FIT - Trưa & Tối: 650,000đ\n🍽️ Gói FULL - 3 bữa/ngày: 825,000đ\n🥙 Gói SLIM - Không tinh bột: 600,000đ\n💪 Gói MEAT - Tăng cơ: 950,000đ\n\nBạn có thể xem chi tiết trong app hoặc liên hệ 1900-xxxx để được tư vấn!";
    }
    
    // Order tracking
    if (text.match(/đơn hàng|order|theo dõi|kiểm tra đơn/i)) {
      return "Để kiểm tra đơn hàng, bạn có thể:\n\n1️⃣ Vào mục 'Đơn hàng' trong app\n2️⃣ Xem trạng thái và lịch sử đơn hàng\n3️⃣ Liên hệ hotline: 1900-xxxx nếu cần hỗ trợ\n\nBạn cần thêm thông tin gì không?";
    }
    
    // Price
    if (text.match(/giá|price|bao nhiêu|chi phí|phí/i)) {
      return "Giá các gói FoodApp:\n\n💵 Gói FIT (Trưa-Tối): 650,000đ/tuần\n💵 Gói FULL (3 bữa): 825,000đ/tuần\n💵 Gói SLIM: 600,000đ/tuần\n💵 Gói MEAT: 950,000đ/tuần\n\n✨ Miễn phí giao hàng trong nội thành!\n\nBạn muốn đặt gói nào?";
    }
    
    // Contact/Support
    if (text.match(/liên hệ|contact|hotline|support|hỗ trợ|help/i)) {
      return "📞 Liên hệ FoodApp:\n\nHotline: 1900-xxxx\nEmail: support@foodapp.vn\nGiờ làm việc: 8:00 - 22:00 (T2-CN)\n\nĐội ngũ chúng tôi luôn sẵn sàng hỗ trợ bạn! 😊";
    }
    
    // Delivery
    if (text.match(/giao hàng|ship|delivery|vận chuyển/i)) {
      return "🚚 Chính sách giao hàng:\n\n✅ Giao hàng 2 lần/ngày\n✅ Miễn phí trong nội thành\n✅ Đóng gói cẩn thận, giữ nhiệt\n✅ Shipper thân thiện, chuyên nghiệp\n\nBạn muốn biết thêm gì về giao hàng không?";
    }
    
    // Payment
    if (text.match(/thanh toán|payment|pay|tiền/i)) {
      return "💳 Phương thức thanh toán:\n\n✅ COD (Tiền mặt)\n✅ Chuyển khoản ngân hàng\n✅ PayOS (Quét QR)\n✅ Ví điện tử (Momo, ZaloPay)\n\nTất cả đều an toàn và tiện lợi!";
    }
    
    // Thanks
    if (text.match(/cảm ơn|thank|thanks|cám ơn/i)) {
      return "Rất vui được hỗ trợ bạn! 😊\n\nNếu cần thêm thông tin, đừng ngại hỏi tôi nhé. Chúc bạn một ngày tốt lành! 🌟";
    }
    
    // Default
    return "Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. 🤔\n\nBạn có thể hỏi tôi về:\n• Thực đơn & gói cước\n• Đơn hàng\n• Giao hàng\n• Thanh toán\n• Liên hệ hỗ trợ\n\nHoặc gọi hotline 1900-xxxx để được tư vấn trực tiếp!";
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // Simulate bot thinking delay
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage.text);
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 800); // Delay 800ms để giống bot thật đang suy nghĩ
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isOpen, messages]);

  // Ẩn chatbot ở trang login và register
  const hiddenRoutes = ['/login', '/register', '/index'];
  const shouldHide = hiddenRoutes.includes(pathname);

  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>💬</Text>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🤖 AI Assistant</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.isBot ? styles.botBubble : styles.userBubble
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.isBot ? styles.botText : styles.userText
                ]}>
                  {msg.text}
                </Text>
                <Text style={styles.timestamp}>
                  {msg.timestamp.toLocaleTimeString('vi-VN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageBubble, styles.botBubble]}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={[styles.messageText, styles.botText]}>
                  Đang suy nghĩ...
                </Text>
              </View>
            )}
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
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 9999,
  },
  buttonText: {
    fontSize: 28,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#007bff",
    borderBottomWidth: 1,
    borderBottomColor: "#0056b3",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007bff",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  botText: {
    color: "#333",
  },
  userText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    color: "#333",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
});
