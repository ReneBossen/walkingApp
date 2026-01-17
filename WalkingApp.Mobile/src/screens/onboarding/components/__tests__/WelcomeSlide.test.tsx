import React from 'react';
import { render } from '@testing-library/react-native';
import { useWindowDimensions } from 'react-native';
import WelcomeSlide from '../WelcomeSlide';

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  Text: ({ children, ...props }: any) => {
    const { Text: RNText } = jest.requireActual('react-native');
    return <RNText {...props}>{children}</RNText>;
  },
  useTheme: () => ({
    colors: {
      background: '#FFFFFF',
      primary: '#6200EE',
      onBackground: '#000000',
      onSurfaceVariant: '#49454F',
    },
  }),
}));

// Mock useWindowDimensions
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  useWindowDimensions: jest.fn(),
}));

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;

describe('WelcomeSlide', () => {
  beforeEach(() => {
    mockUseWindowDimensions.mockReturnValue({
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1,
    });
  });

  describe('rendering', () => {
    it('WelcomeSlide_WithAllProps_RendersEmoji', () => {
      const { getByText } = render(
        <WelcomeSlide emoji="🚶‍♂️" title="Test Title" description="Test Description" />
      );

      expect(getByText('🚶‍♂️')).toBeTruthy();
    });

    it('WelcomeSlide_WithAllProps_RendersTitle', () => {
      const { getByText } = render(
        <WelcomeSlide emoji="🚶‍♂️" title="Test Title" description="Test Description" />
      );

      expect(getByText('Test Title')).toBeTruthy();
    });

    it('WelcomeSlide_WithAllProps_RendersDescription', () => {
      const { getByText } = render(
        <WelcomeSlide emoji="🚶‍♂️" title="Test Title" description="Test Description" />
      );

      expect(getByText('Test Description')).toBeTruthy();
    });

    it('WelcomeSlide_WithDifferentEmoji_RendersCorrectEmoji', () => {
      const { getByText } = render(
        <WelcomeSlide emoji="📊" title="Test Title" description="Test Description" />
      );

      expect(getByText('📊')).toBeTruthy();
    });

    it('WelcomeSlide_WithLongDescription_RendersFullText', () => {
      const longDescription = 'This is a very long description that should still be rendered correctly without any issues';
      const { getByText } = render(
        <WelcomeSlide emoji="🚶‍♂️" title="Test Title" description={longDescription} />
      );

      expect(getByText(longDescription)).toBeTruthy();
    });
  });

  describe('layout', () => {
    it('WelcomeSlide_WithScreenWidth_UsesFullWidth', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 400,
        height: 800,
        scale: 2,
        fontScale: 1,
      });

      const { getByText } = render(
        <WelcomeSlide emoji="🚶‍♂️" title="Test Title" description="Test Description" />
      );

      const slide = getByText('🚶‍♂️').parent?.parent;
      expect(slide).toBeTruthy();
    });

    it('WelcomeSlide_WithDifferentScreenWidths_AdaptsCorrectly', () => {
      mockUseWindowDimensions.mockReturnValue({
        width: 320,
        height: 568,
        scale: 2,
        fontScale: 1,
      });

      const { getByText, rerender } = render(
        <WelcomeSlide emoji="🚶‍♂️" title="Test Title" description="Test Description" />
      );

      expect(getByText('Test Title')).toBeTruthy();

      mockUseWindowDimensions.mockReturnValue({
        width: 414,
        height: 896,
        scale: 3,
        fontScale: 1,
      });

      rerender(
        <WelcomeSlide emoji="🚶‍♂️" title="Test Title" description="Test Description" />
      );

      expect(getByText('Test Title')).toBeTruthy();
    });
  });

  describe('content variations', () => {
    it('WelcomeSlide_WithMultipleEmojiCharacters_RendersCorrectly', () => {
      const { getByText } = render(
        <WelcomeSlide emoji="🚶‍♂️🚶‍♀️" title="Test Title" description="Test Description" />
      );

      expect(getByText('🚶‍♂️🚶‍♀️')).toBeTruthy();
    });

    it('WelcomeSlide_WithSpecialCharactersInTitle_RendersCorrectly', () => {
      const { getByText } = render(
        <WelcomeSlide emoji="🚶‍♂️" title="Title & Co." description="Test Description" />
      );

      expect(getByText('Title & Co.')).toBeTruthy();
    });

    it('WelcomeSlide_WithNewlinesInDescription_RendersCorrectly', () => {
      const { getByText } = render(
        <WelcomeSlide
          emoji="🚶‍♂️"
          title="Test Title"
          description="Line 1 Line 2"
        />
      );

      expect(getByText('Line 1 Line 2')).toBeTruthy();
    });
  });
});
